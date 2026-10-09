# Trạng thái hiện tại

- **Ai cập nhật:** mỗi người tự sửa dòng của mình khi xong task (`/team-finish`) và trước buổi họp Thứ Hai.
- **Ai đọc:** cả nhóm và Claude, ở đầu mỗi phiên (`/team-start`).
- Giữ ngắn: tối đa 3 gạch đầu dòng mỗi cột. Lịch sử xem git log, không chép vào đây.

Cập nhật lần cuối: 09/10/2026 · Tuần 1

| Người | Đã xong (tuần này) | Đang làm | Đang vướng / chờ ai |
| --- | --- | --- | --- |
| Triển | ADR 0001 (chốt TypeScript 06/10); openapi v0.1 (8 nhóm, 37 API + `/health` + 2 endpoint Q6/Q15, lint đạt, mock Prism chạy được) | Khung NestJS (nhánh `trienw1-openapi`, chưa PR); openapi đủ 74 API (16/10) | Q16 (Hồng Anh), Q17 (Huy Trường) |
| Hồng Anh | docker-compose ban đầu (Postgres 15, pgAdmin) | Thêm MailHog + extension btree_gist, unaccent, pg_trgm; migration 10 bảng | |
| Sơn | Khung FE (PR #4); review openapi v0.1 (duyệt); lớp API: `api/client.ts` (refresh 1 lần cho nhiều 401), `httpAuthApi`, mock Prism qua `npm run dev:mock`, đăng nhập chỉ SĐT (PR `tsonw1-uc02-api-client`, 22 test xanh) | Bàn giao client, `queryKeys`, mock cho Bằng (`/team-handoff`); tuần 2: màn đăng ký, hồ sơ, đổi mật khẩu | Chờ endpoint Xác thực chạy thật (Triển, 14/10) để kiểm chứng refresh qua cookie |
| Bằng | | Figma màn demo, token, component | |
| Huy Trường | | Tài liệu 2 v3, tiêu chí chấp nhận, bảng công việc | |
