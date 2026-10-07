---
name: fe-lead-week
description: Tóm tắt việc tuần này của Trường Sơn (FE Lead) trong dự án gym, gồm việc của Sơn, việc của Bằng, phụ thuộc vào BE và việc đang trễ. Chỉ chạy khi Sơn gõ /fe-lead-week.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git log *) Bash(git branch *) Bash(date *)
---

# Việc tuần này của FE Lead

Hôm nay: !`date +%F`

1. Đọc `docs/plan/fe-plan.md`. Tuần 1 bắt đầu 05/10/2026, mỗi tuần từ Thứ Hai đến Chủ Nhật; xác định tuần hiện tại.
2. Liệt kê theo 4 nhóm, mỗi dòng một việc kèm hạn:
   - **Sơn làm tuần này** (cột Sơn), đánh dấu việc nào có hạn trước Thứ Sáu.
   - **Bằng làm tuần này** (cột Bằng), để Sơn theo dõi và review.
   - **Đang chờ BE** (cột Phụ thuộc), kèm tên người và ngày hẹn.
   - **Có thể đang trễ:** việc tuần trước chưa thấy dấu vết trong `git log --since="14 days ago" --oneline -- frontend` (tìm theo mã UC hoặc tên màn).
3. Đề xuất thứ tự làm 3 việc tiếp theo cho Sơn. Việc đang chặn Bằng hoặc demo được ưu tiên trước.
4. Soạn sẵn 1 tin nhắn ngắn cho nhóm chat FE (Sơn gửi Bằng) nêu việc tuần này và hạn.

Trả lời ngắn, tiếng Việt, không chép lại cả bảng kế hoạch.
