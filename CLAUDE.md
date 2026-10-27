# CLAUDE.md — JuniorLoop

## Dự án là gì

Job board gom tin tuyển dụng IT cho junior dev VN: `packages/ingest` quét TopDev (API,
chạy GitHub Actions) + ITviec, TopCV (HTML, chạy từ máy cá nhân) → PostgreSQL (Kysely)
→ `apps/web` (Next.js ISR) hiển thị, lọc junior, chấm điểm độ hợp phía client theo hồ
sơ trong localStorage (không auth, không PII). Monorepo pnpm; mục tiêu kép: sản phẩm
thật + portfolio (stack TS/React/Node/PG/Kysely).

## Quy ước bắt buộc

- **Trả lời người dùng bằng tiếng Việt.** Code: tên hàm/biến tiếng Việt không dấu
  (`chamDiem`, `boDau`, `lanQuet`…), docstring tiếng Việt — giữ nhất quán.
- **Commit tiếng Việt**, conventional (`feat:`, `fix:`, `chore:`), **KHÔNG
  Co-Authored-By**. Email commit repo này: **tdmhale5@gmail.com** (đã set cục bộ;
  repo cá nhân — không dùng email công ty; sai thì hướng dẫn sửa, không tự
  amend/force-push).
- Package dùng chung (`core`) phải **isomorphic** — không import `node:*` (client
  cũng chạy chấm điểm). `db`/`ingest` là server-only.
- Schema đổi bằng file SQL mới trong `packages/db/migrations/` (đánh số tăng dần),
  không sửa file đã áp.
- Test: Vitest trong `packages/core` cho mọi logic thuần (chấm điểm, chuẩn hoá);
  parser nguồn kiểm bằng chạy thật, không mock HTML (mock sẽ mục).

## Điều KHÔNG được làm

- **Không biến thành bot tự ứng tuyển**; **không thêm LinkedIn làm nguồn** (UA 8.2
  của LinkedIn cấm); **không copy mô tả JD** vào DB (chỉ metadata); **không lưu/hiện
  thông tin liên hệ cá nhân** trong tin (Nghị định 13/2023).
- Không giảm delay dưới 1s, không quét song song, không thêm retry khi bị 403 —
  circuit breaker đang ngắt sau 3 lần là chủ ý. Bị yêu cầu dừng → tắt nguồn qua
  bảng `nguon` (kill-switch), không tranh luận.
- Không lưu raw HTML/payload vào DB (Neon free 1 GB).
- Không thêm quảng cáo/kiếm tiền khi còn deploy Vercel Hobby (điều khoản
  phi thương mại).
- Không dùng `next/image` cho logo công ty (quota 5K transformation/tháng).

## Kiến trúc & lối đi quen

- Nguồn mới = 1 file trong `packages/ingest/src/nguon/` export `HamNguon`, đăng ký
  vào `NGUON` ở `src/index.ts`, thêm dòng INSERT vào migration mới. Fail mềm từng
  nguồn — một nguồn chết không được kéo sập lần quét.
- Key chống trùng trong-nguồn: `UNIQUE(nguon, nguon_id)`. Tin thấy lại → upsert mở
  lại + cập nhật `last_seen_at`, giữ `first_seen_at`.
- Tin senior gắn cờ `la_senior`, KHÔNG xoá. Hết hạn (`het_han`) chỉ đặt khi ≥2 lần
  quét ok liên tiếp không thấy lại (logic tuần 2 — xem ROADMAP).
- Web đọc DB duy nhất qua `apps/web/lib/data.ts` (unstable_cache tag `viec`);
  ingest xong gọi `POST /api/revalidate?secret=…`. Đừng query DB trực tiếp trong
  page/component.
- Env: `.env` ở GỐC monorepo (next.config.ts tự nạp); xem `.env.example`.

## Lệnh hay dùng

```bash
pnpm db:migrate                         # tạo DB nếu chưa có + áp migrations
pnpm quet --nguon topdev                # quét 1 nguồn (KHÔNG cần "--" trước flag)
pnpm quet --nguon itviec,topcv          # nguồn HTML (máy cá nhân)
pnpm test && pnpm typecheck             # trước khi commit
pnpm dev                                # web ở localhost:3000
```
