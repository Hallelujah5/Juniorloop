# ROADMAP — JuniorLoop

## Đã xong (MVP tuần 1 — 27/10/2026)

- Monorepo pnpm: `core` (chuẩn hoá + chấm điểm, Vitest), `db` (Kysely + migrations,
  kill-switch per-source), `ingest` (TopDev API + ITviec/TopCV HTML, circuit breaker,
  CLI), `web` (list + lọc + sort theo điểm, hồ sơ localStorage, trạng thái pipeline,
  nguyên tắc dữ liệu, revalidate theo tag).
- Workflows: `tham-do` (thí nghiệm IP datacenter), `quet-topdev` (cron 6h), `ci`.

## Tuần 2 — vòng đời & danh mục

- [ ] Expiry: job cuối lần quét đánh `het_han` khi ≥2 lần quét ok liên tiếp không
      thấy lại; thấy lại thì mở lại (đã có sẵn chiều mở lại trong upsert).
- [ ] Trang danh mục `/viec-lam/{skill}` và `/viec-lam/{skill}/{thanh-pho}` — nơi
      đặt giá trị SEO (số tin, thống kê lương hiển thị, ItemList).
- [ ] ITviec: tách tên công ty từ slug (hiện fallback "(xem trong tin)").
- [ ] Chạy `tham-do` trên Actions → chốt phân bổ nguồn CI vs máy cá nhân vào README.

## Tuần 3 — dedupe & đánh bóng

- [ ] Dedupe cross-source: blocking theo `cong_ty_chuan` + bucket thành phố,
      token-set Jaccard ≥ 0.6 (map ~15 cặp đồng nghĩa) → gán `nhom_trung`,
      UI gộp 1 card nhiều nút nguồn. Không merge phá huỷ; thà sót còn hơn gộp sai.
- [ ] Thành phố là filter thật (hiện ITviec/TopCV khoá Hà Nội ở URL quét).
- [ ] README thêm ảnh chụp + diagram kiến trúc.

## Trước khi dùng làm portfolio

- [ ] Chuyển repo public (đang private vì chủ repo còn đi làm).
- [ ] Deploy Vercel (Hobby, phi thương mại) + Neon; điền secrets
      `DATABASE_URL`, `REVALIDATE_URL`, `REVALIDATE_SECRET` vào GitHub.
- [ ] Backup tuần: workflow `pg_dump` ra artifact.

## Sau MVP (không cam kết thứ tự)

- [ ] Tài khoản + lưu tìm kiếm + email digest (lúc đó mới cần auth).
- [ ] VietnamWorks: chỉ thêm lại nếu có đường link-out đàng hoàng (feed/hợp tác).
- [ ] LLM phân tích JD (tóm tắt yêu cầu thật, cờ đỏ) — bắt trend tuyển junior có
      kỹ năng AI; chạy on-demand để không tốn tiền.
- [ ] Thống kê lương theo skill/city từ `luong_raw` (cần parser lương tử tế).

## Nhắc vận hành

- Actions schedule tự TẮT nếu repo 60 ngày không hoạt động (GitHub gửi mail) —
  tháng nào cũng nên có commit.
- Vercel Hobby cấm thương mại: không ads. Muốn kiếm tiền → Pro hoặc đổi hosting.
