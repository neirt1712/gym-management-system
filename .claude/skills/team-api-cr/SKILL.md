---
name: team-api-cr
description: Tạo yêu cầu thay đổi hợp đồng API (CR) trong dự án gym khi phát hiện code, mock hoặc nhu cầu màn hình lệch với openapi.yaml. Dùng khi người dùng gõ /team-api-cr hoặc nói API thiếu field, sai kiểu, cần thêm mã lỗi hay endpoint.
argument-hint: "[endpoint] [vấn đề]"
---

# Yêu cầu thay đổi API

Đầu vào: $ARGUMENTS.

1. Tra endpoint trong `docs/api/openapi.yaml`, `docs/spec/api-v3.md` và `docs/spec/use-cases-v3.md`. Xác nhận lệch là thật. Đọc cả code liên quan nếu có.
2. Nếu thay đổi làm danh mục 74 API hoặc 44 use case khác đi, ghi rõ "Đổi bản chuẩn, cần họp Thứ Hai".
3. Lấy số CR tiếp theo trong `docs/handoff/api-change-requests/`, tạo `CR-<số 3 chữ số>-<ten-ngan>.md` theo mẫu `_MAU.md`:
   - endpoint;
   - hiện tại;
   - đề xuất;
   - lý do và UC;
   - ảnh hưởng (FE, BE, test, dữ liệu);
   - mức (không phá / phá);
   - người duyệt (Triển).
4. Thêm dòng vào `docs/handoff/OPEN_QUESTIONS.md` trỏ tới CR.
5. Soạn tin nhắn cho Triển (3–4 dòng). **Không code theo đề xuất khi CR chưa được duyệt.** Trong lúc chờ, đề xuất việc khác trong tuần để làm.
