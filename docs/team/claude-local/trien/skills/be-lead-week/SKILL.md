---
name: be-lead-week
description: Tóm tắt việc tuần này của Triển (BE Lead) trong dự án gym, gồm việc của Triển, việc của Hồng Anh, hạn hợp đồng API mà FE đang chờ và việc đang trễ. Chỉ chạy khi Triển gõ /be-lead-week.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git log *) Bash(git branch *) Bash(date *)
---

# Việc tuần này của BE Lead

Hôm nay: !`date +%F`

1. Đọc `docs/plan/be-plan.md`. Tuần 1 bắt đầu 05/10/2026, mỗi tuần từ Thứ Hai đến Chủ Nhật; xác định tuần hiện tại.
2. Liệt kê theo 4 nhóm, mỗi dòng một việc kèm hạn:
   - **Triển làm tuần này** (cột Triển), đánh dấu việc có hạn trước Thứ Sáu.
   - **Hồng Anh làm tuần này** (cột Hồng Anh), để Triển theo dõi và review.
   - **FE đang chờ BE:** nhóm endpoint trong `docs/handoff/CONTRACT_STATUS.md` có hạn tuần này mà cột openapi hoặc BE chưa xong; ai ở FE đang chờ (`docs/plan/fe-plan.md`, cột Phụ thuộc).
   - **Có thể đang trễ:** việc tuần trước chưa thấy dấu vết trong `git log --since="14 days ago" --oneline -- backend docs/api` (tìm theo mã UC, tên module).
3. Câu hỏi trong `docs/handoff/OPEN_QUESTIONS.md` có tên Triển ở cột "Hỏi ai" hoặc "Ảnh hưởng ai": liệt kê kèm hạn.
4. Đề xuất thứ tự làm 3 việc tiếp theo cho Triển. Việc đang chặn FE, Hồng Anh hoặc demo được ưu tiên trước.
5. Soạn sẵn 1 tin nhắn ngắn cho nhóm chat BE (Triển gửi Hồng Anh) nêu việc tuần này và hạn.

Trả lời ngắn, tiếng Việt, không chép lại cả bảng kế hoạch.
