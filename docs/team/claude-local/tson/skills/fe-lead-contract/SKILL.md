---
name: fe-lead-contract
description: Xử lý khi docs/api/openapi.yaml của dự án gym thay đổi: sinh lại kiểu cho FE, tìm chỗ vỡ, phân việc sửa cho Sơn và Bằng, soạn tin nhắn. Chỉ chạy khi Sơn gõ /fe-lead-contract.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git log *) Bash(npm run gen:api*) Bash(npm run typecheck*)
---

# Đồng bộ hợp đồng API

1. Xem yaml đổi gì: `git diff HEAD~1 -- docs/api/openapi.yaml`, hoặc so với commit/nhánh trong $ARGUMENTS. Tóm tắt theo 3 nhóm: endpoint mới, field đổi hoặc bỏ, mã lỗi mới.
2. Trong `frontend/`, chạy `npm run gen:api`, rồi `npm run typecheck`.
3. Gom lỗi typecheck theo file. Dựa vào bảng sở hữu trong `frontend/CLAUDE.md`, gán file nào cho Sơn, file nào cho Bằng.
4. Mã lỗi mới: lấy câu từ `docs/api/error-codes.md` chép vào `frontend/src/lib/errors.ts`; mã chưa có câu thì nhắc Hồng Anh bổ sung.
5. Thay đổi phá hợp đồng (bỏ field FE đang dùng, đổi kiểu): soạn tin nhắn cho Triển hỏi lại, nêu file FE bị ảnh hưởng.
6. Trả về:
   - bảng thay đổi;
   - danh sách việc sửa của Sơn;
   - danh sách việc sửa của Bằng;
   - tin nhắn mẫu cho Bằng;
   - tin nhắn mẫu cho Triển (nếu cần).

Chưa sửa code; chỉ sửa sau khi Sơn đồng ý.
