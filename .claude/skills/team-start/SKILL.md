---
name: team-start
description: Bắt đầu một task trong dự án gym. Đọc vai trò, trạng thái, use case, API liên quan, kiểm tra Definition of Ready rồi lập kế hoạch ngắn chờ duyệt. Dùng khi người dùng gõ /team-start hoặc nói bắt đầu, nhận, làm task hay thẻ mới.
argument-hint: "[UCxx hoặc mô tả task]"
---

# Bắt đầu task

Đầu vào: $ARGUMENTS.

0. **Có gì mới** (làm trước tiên, ngắn gọn):
   - `git fetch origin`. Nếu nhánh `develop` trên máy cũ hơn `origin/develop` (`git log develop..origin/develop` có commit), nhắc người dùng **lấy code mới trước** (GitHub Desktop: Fetch → Pull, hoặc để Claude chạy `git switch develop && git pull`) rồi mới làm tiếp.
   - Liệt kê thay đổi trong tài liệu chung kể từ lần người dùng lấy code gần nhất (`git log develop..origin/develop`); nếu đã mới nhất thì lấy 3 ngày gần đây (`git log origin/develop --since="3 days ago"`). Chỉ xét: `docs/handoff/OPEN_QUESTIONS.md`, `docs/handoff/STATUS.md`, `docs/spec/`, `docs/plan/`, `docs/api/`, `docs/reports/tuan-*/CHOT-*.md`, `CLAUDE.md`, `CONTRIBUTING.md`, file vai trò của người dùng.
   - Báo tối đa 5 dòng, **chỉ những thay đổi có tên người dùng ở cột "Ảnh hưởng ai"** hoặc chạm thư mục họ sở hữu, mỗi dòng: đổi gì → người dùng cần sửa gì. Không có gì liên quan thì nói "Không có thay đổi liên quan tới bạn".
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
   - tên nhánh `<ten>w<tuan>-<mo-ta-ngan>` theo `CONTRIBUTING.md` (ví dụ `tsonw1-fe-scaffold`);
   - file sẽ tạo/sửa;
   - cách kiểm tra (lệnh, dữ liệu mẫu);
   - rủi ro hoặc giả định.
6. **Dừng, chờ người dùng duyệt** trước khi tạo nhánh hay sửa file. Task nhỏ (một file, dưới khoảng 20 dòng) thì hỏi gộp "làm luôn nhé?".
