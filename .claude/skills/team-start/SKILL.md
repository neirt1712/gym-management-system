---
name: team-start
description: Bắt đầu một task trong dự án gym. Đọc vai trò, trạng thái, use case, API liên quan, kiểm tra Definition of Ready rồi lập kế hoạch ngắn chờ duyệt. Dùng khi người dùng gõ /team-start hoặc nói bắt đầu, nhận, làm task hay thẻ mới.
argument-hint: "[UCxx hoặc mô tả task]"
---

# Bắt đầu task

Đầu vào: $ARGUMENTS.

1. **Đọc ngữ cảnh:**
   - `CLAUDE.local.md` để biết người dùng là ai và file vai trò của họ;
   - `docs/handoff/STATUS.md`;
   - bàn giao liên quan trong `docs/handoff/handoffs/`;
   - dòng của tuần hiện tại trong `docs/plan/*-plan.md` (tuần 1 bắt đầu 05/10/2026, tính từ ngày hôm nay).
2. **Xác định phạm vi:** mã UC, bảng và endpoint liên quan (`docs/spec/use-cases-v3.md`, `api-v3.md`, `erd-v3.md`), quyết định nghiệp vụ liên quan (`docs/spec/decisions.md`). Không tìm thấy thì dừng, hỏi; không bịa.
3. **Kiểm tra Definition of Ready** theo `docs/process/dor-dod.md`. Endpoint cần dùng có trạng thái gì trong `docs/handoff/CONTRACT_STATUS.md` (Chưa có, Mock, Real, Changed)? Thiếu thứ gì thì nêu rõ thiếu gì và ai đang giữ.
4. **Kiểm tra phạm vi sở hữu:** task có nằm trong thư mục người dùng được sửa không. Không thì đề xuất chuyển hoặc tạo issue.
5. **Lập kế hoạch** tối đa 8 dòng:
   - mục tiêu;
   - tên nhánh `feature/UCxx-<mo-ta-ngan>`;
   - file sẽ tạo/sửa;
   - cách kiểm tra (lệnh, dữ liệu mẫu);
   - rủi ro hoặc giả định.
6. **Dừng, chờ người dùng duyệt** trước khi tạo nhánh hay sửa file. Task nhỏ (một file, dưới khoảng 20 dòng) thì hỏi gộp "làm luôn nhé?".
