# JuniorLoop

> **EN —** A job board for junior developers in Vietnam: ingests postings from TopDev
> (public JSON API, runs on GitHub Actions) and ITviec/TopCV (public HTML, runs from a
> residential machine — hybrid by design, since datacenter IPs get challenged), stores
> metadata-only in PostgreSQL (Kysely), serves a Next.js ISR frontend with client-side
> personal fit-scoring (localStorage profile, no accounts, no PII). Non-commercial.
> Docs below in Vietnamese.

Job board cho junior dev Việt Nam: gom tin từ **TopDev, ITviec, TopCV** mỗi 6 tiếng,
lọc tin **junior thật sự** (tin senior bị gắn cờ và ẩn), và **chấm điểm độ hợp** của
từng tin theo hồ sơ bạn khai — tính ngay trong trình duyệt, không tài khoản, không
gửi dữ liệu đi đâu.

## Chạy local

Cần Node ≥ 22, pnpm ≥ 9, PostgreSQL (local hoặc [Neon](https://neon.tech) free).

```bash
cp .env.example .env        # sửa DATABASE_URL nếu cần
pnpm install
pnpm db:migrate             # tự tạo database nếu chưa có + áp schema
pnpm quet                   # quét cả 3 nguồn lần đầu (vài phút, có delay lịch sự)
pnpm dev                    # http://localhost:3000
```

## Kiến trúc

```
GitHub Actions (cron 6h) ──ingest topdev──┐
                                          ├─→ PostgreSQL (Neon) ─→ Next.js ISR (Vercel)
Máy cá nhân (schtasks)  ──ingest itviec/topcv─┘        ↑                │
                                          └── POST /api/revalidate ←────┘ (tag 'viec')
```

| Package | Vai trò |
|---|---|
| `packages/core` | Chuẩn hoá (bỏ dấu, chuẩn hoá công ty), nhận diện senior, **chấm điểm** — thuần, isomorphic, có Vitest |
| `packages/db` | Kysely types + migrations; bảng `nguon` là **kill-switch** từng nguồn |
| `packages/ingest` | CLI quét: `pnpm quet --nguon topdev --tu-khoa nodejs,reactjs`; circuit breaker ngắt khi 403×3 |
| `apps/web` | List + lọc + sort theo điểm; `/ho-so` (localStorage); `/trang-thai` (pipeline); `/nguyen-tac` |

**Vì sao hybrid?** GitHub Actions dùng IP datacenter Azure — Cloudflare của các trang
HTML nhiều khả năng chặn. Nguồn API chạy CI; nguồn HTML chạy từ máy cá nhân (IP dân
cư) bằng đúng CLI đó. Workflow `tham-do` curl thử 4 nguồn từ runner để kiểm chứng
thay vì đoán.

Đặt lịch nguồn HTML trên Windows:

```powershell
schtasks /Create /TN "JuniorLoopQuet" /SC DAILY /ST 08:30 /TR "cmd /c cd /d D:\TranBaoPhuc\juniorloop && pnpm quet --nguon itviec,topcv" /F
```

## Đạo đức quét — đọc trước khi fork

Đây là phần quan trọng nhất của repo, không phải phần kỹ thuật:

- **Chỉ metadata, luôn link-out.** Không copy mô tả JD (tác phẩm được bảo hộ); không
  lưu thông tin liên hệ cá nhân trong tin (Nghị định 13/2023). JuniorLoop đưa người
  dùng *đến* trang nguồn, không thay thế họ.
- **Lịch sự là điều kiện tồn tại**: 4 lần/ngày, delay ≥1s giữa request, UA ghi danh
  tính, không quét sau đăng nhập, không vượt CAPTCHA, circuit breaker dừng ngay khi
  bị chặn — và không retry.
- **Kill-switch**: trang nguồn yêu cầu dừng → `UPDATE nguon SET enabled_ingest=false,
  enabled_hien_thi=false WHERE ma='...'` — có hiệu lực không cần deploy.
- **VietnamWorks bị tắt chủ động** dù API gọi được: API công khai của họ giấu jobUrl —
  chúng tôi tôn trọng tín hiệu đó thay vì dựng lại link.
- **Không phải bot ứng tuyển** và sẽ không bao giờ là: tự động hoá dừng ở khâu *tìm*,
  khâu *nộp* là của con người. Không có nguồn LinkedIn (ToS của họ cấm).

## Deploy (0đ/tháng)

1. [Neon](https://neon.tech) free → tạo project, lấy `DATABASE_URL`, chạy
   `pnpm db:migrate` trỏ vào đó.
2. [Vercel](https://vercel.com) Hobby → import repo, root `apps/web`, thêm env
   `DATABASE_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_BASE_URL`.
   **Hobby là phi thương mại — không gắn quảng cáo.**
3. GitHub repo → Settings → Secrets: `DATABASE_URL`, `REVALIDATE_URL`
   (https://&lt;app&gt;.vercel.app), `REVALIDATE_SECRET` → bật workflow `quet-topdev`.
4. Lưu ý: schedule của Actions tự tắt nếu repo im 60 ngày — GitHub sẽ gửi mail.

## Giấy phép

MIT — © 2026 Tran Bao Phuc. Xem thêm [ROADMAP.md](ROADMAP.md) và [CLAUDE.md](CLAUDE.md).
