---
name: be-lead-review
description: Review một PR hoặc nhánh backend của dự án gym với tư cách BE Lead (Triển): kiểm khớp openapi, quyền sở hữu, transaction và khóa, mã lỗi, migration, test. Chỉ chạy khi Triển gõ /be-lead-review.
disable-model-invocation: true
argument-hint: "[số PR hoặc tên nhánh]"
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git log *) Bash(gh pr view *) Bash(gh pr diff *) Bash(npm run lint*) Bash(npm run typecheck*) Bash(npm run test*)
---

# Review PR backend

Đầu vào: $ARGUMENTS. Là số thì dùng `gh pr diff <số>`; là tên nhánh thì dùng `git diff develop...<nhánh> -- backend docs/api`.

1. **Hiểu PR:** đọc tiêu đề và mô tả; xác định mã UC; mở dòng UC trong `docs/spec/use-cases-v3.md` và endpoint trong `docs/spec/api-v3.md`.
2. **Phạm vi:** file sửa có đúng module của tác giả theo `docs/team/roles/be-lead.md`, `be-sub.md` không. Sửa `backend/src/common/`, `backend/prisma/` thì xem kỹ ảnh hưởng tới module khác.
3. **Hợp đồng:** request, response, mã lỗi khớp `docs/api/openapi.yaml`; mã lỗi có trong `docs/api/error-codes.md`; danh sách trả `{data, meta}`, lỗi trả `{error:{code,message,details,requestId}}`; tiền là số nguyên, giờ ISO 8601 `+07:00`. Đổi API thì PR phải có sửa yaml và `docs/api/CHANGELOG.md`.
4. **Nghiệp vụ:** khớp `.claude/rules/domain.md` và `docs/spec/decisions.md`. Ví dụ: gói chỉ sinh khi thanh toán SUCCESS trong cùng transaction; không lưu cột số buổi; `expectedVersion` cho lịch PT; BE tính mọi ngày nghiệp vụ (Q9).
5. **An toàn dữ liệu:** kiểm sở hữu mọi `{id}`; transaction và `SELECT … FOR UPDATE` đúng chỗ; unique, exclusion constraint có trong migration; IPN và thao tác lặp không tạo bản ghi đôi.
6. **Migration (nếu có):** đã xem SQL (`--create-only`), ràng buộc đặc biệt viết tay có dòng `-- rule:`, seed chạy lại được.
7. **Theo checklist của skill `be-check`**, rồi chạy `npm run lint && npm run typecheck && npm run test`.

Kết quả là nhận xét tiếng Việt, giọng góp ý giữa bạn với bạn, chia 3 mức:
- **Phải sửa trước khi merge:** sai nghiệp vụ, sai hợp đồng, thiếu kiểm quyền, vỡ test.
- **Nên sửa:** cấu trúc, tên, lặp code, thiếu test phụ.
- **Gợi ý:** cải thiện nhỏ, có thể để sau.

Mỗi nhận xét ghi `file:dòng` và cách sửa cụ thể. Cuối cùng kết luận một dòng: "Duyệt", "Duyệt sau khi sửa mục Phải sửa" hoặc "Chưa duyệt". Không tự sửa code của tác giả.
