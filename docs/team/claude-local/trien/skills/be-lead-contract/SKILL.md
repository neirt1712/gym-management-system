---
name: be-lead-contract
description: Khi Triển sửa docs/api/openapi.yaml của dự án gym: kiểm yaml hợp lệ, ghi CHANGELOG, cập nhật CONTRACT_STATUS, xử lý CR đang chờ và soạn tin báo Sơn, Hồng Anh. Chỉ chạy khi Triển gõ /be-lead-contract.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git log *) Bash(npx @redocly/cli lint *)
---

# Phát hành thay đổi hợp đồng API

1. Xem yaml đổi gì: `git diff develop -- docs/api/openapi.yaml`, hoặc so với commit/nhánh trong $ARGUMENTS. Tóm tắt theo 4 nhóm: endpoint mới, field thêm, field đổi hoặc bỏ (phá hợp đồng), mã lỗi mới.
2. Chạy `npx @redocly/cli lint docs/api/openapi.yaml`; báo lỗi thật nếu có.
3. Đối chiếu: endpoint có trong `docs/spec/api-v3.md` (thiếu thì nhắc Huy Trường bổ sung, không tự thêm vào spec); mã lỗi có trong `docs/api/error-codes.md` (thiếu thì nhắc Hồng Anh); quyết định đã chốt trong `docs/handoff/OPEN_QUESTIONS.md` có liên quan (ví dụ Q12 đăng nhập chỉ bằng SĐT, Q15 email không bắt buộc) đã được phản ánh chưa.
4. CR đang chờ trong `docs/handoff/api-change-requests/`: CR nào được thay đổi này giải quyết thì ghi kết quả vào CR.
5. Soạn sẵn (chờ Triển đồng ý mới ghi):
   - một mục mới trong `docs/api/CHANGELOG.md` (ngày, phiên bản, 4 nhóm thay đổi);
   - cột "openapi" trong `docs/handoff/CONTRACT_STATUS.md` (Chưa có / v0.1 / Đủ).
6. Soạn tin nhắn:
   - cho **Sơn** (Sơn chạy `/fe-lead-contract` để sinh lại kiểu FE), nêu rõ thay đổi phá hợp đồng và file FE có thể bị ảnh hưởng;
   - cho **Hồng Anh** nếu đụng module hoặc mã lỗi của Hồng Anh;
   - cho **Huy Trường** nếu cần sửa test Postman.

Chưa sửa file nào; chỉ ghi sau khi Triển đồng ý.
