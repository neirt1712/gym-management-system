# Definition of Ready, Definition of Done, checklist review, nhịp tuần

- **Ai sở hữu:** Huy Trường (sửa qua họp Thứ Hai).
- **Ai đọc:** mọi người; skill `team-start`, `team-finish` và skill review dùng file này.

## Definition of Ready (được phép bắt đầu)

- [ ] Thẻ có mã UC, người làm, hạn.
- [ ] UC có trong `docs/spec/use-cases-v3.md`; có tiêu chí chấp nhận (Given/When/Then) của Huy Trường.
- [ ] Endpoint cần dùng đã có trong `docs/api/openapi.yaml`. FE có thể làm trên mock; BE cần đủ schema.
- [ ] Phụ thuộc đã xong, hoặc có cách làm trước (mock, bản giả).
- [ ] Màn FE: có wireframe trên Figma đã được Sơn duyệt.

## Definition of Done (được gọi là xong)

- [ ] Đạt tiêu chí chấp nhận của UC.
- [ ] `lint`, `typecheck`, `test`, `build` đạt trên máy và trên CI. Báo kết quả thật.
- [ ] Có test cho logic quan trọng (BE: thành công, sai quyền, mã lỗi chính; FE: trạng thái đang tải, lỗi và logic riêng).
- [ ] Không sửa ngoài phạm vi vai trò; không làm tính năng ngoài phạm vi.
- [ ] Chạy đúng với mock và, khi endpoint đã Real, với API thật trên staging.
- [ ] `docs/handoff/STATUS.md` và `CONTRACT_STATUS.md` đã cập nhật.
- [ ] PR theo mẫu, có 1 review, CI xanh.
- [ ] Có ghi chú bàn giao nếu người khác phụ thuộc.

## Checklist review (chung FE và BE)

1. Đúng UC, không làm thêm việc khác.
2. Đúng hợp đồng `openapi.yaml`: field, kiểu, mã lỗi; không bịa.
3. Đúng quy tắc trong `.claude/rules/domain.md` và `docs/spec/decisions.md`.
4. Xử lý lỗi theo `error.code` (FE); ném `AppError` đúng mã (BE).
5. Chống gửi lặp: FE khóa nút khi đang gửi; BE có unique, transaction, `FOR UPDATE` đúng chỗ.
6. Quyền: BE kiểm sở hữu mọi `{id}`; FE chỉ ẩn/hiện theo `allowedActions` hoặc vai trò.
7. Không lộ dữ liệu nhạy cảm; không `dangerouslySetInnerHTML` với dữ liệu người dùng.
8. Test đủ; tên dễ hiểu; không có code chết, `console.log`, `any`.

Phần riêng: FE theo skill `fe-ui-check`; BE theo skill `be-check`.

## Nhịp tuần

- **Thứ Hai:** họp kế hoạch 30 phút, chốt thay đổi API trước khi code; Sơn và Triển cập nhật `docs/plan/*-plan.md`.
- **Hằng ngày:** 3 dòng trong nhóm chat (hôm qua, hôm nay, đang vướng).
- **Thứ Sáu 20:00:** demo nội bộ trên staging; Huy Trường ghi biên bản và tỷ lệ test đạt.
- Giữ 20% thời gian mỗi tuần cho sửa lỗi và việc phát sinh. Khi trễ, cắt theo thứ tự: MoMo → xuất XLSX → broadcast → upload ảnh đại diện.
