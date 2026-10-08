---
name: team-handoff
description: Viết ghi chú bàn giao trong dự án gym khi một phần việc xong và người khác sẽ dùng hoặc làm tiếp (component, endpoint, màn hình, dữ liệu mẫu). Dùng khi người dùng gõ /team-handoff hoặc nói bàn giao cho ai đó.
argument-hint: "[module] [người nhận]"
---

# Bàn giao

Đầu vào: $ARGUMENTS (ví dụ `purchase-flow Bằng` hoặc `orders Sơn`).

1. Xác định người gửi (từ `CLAUDE.local.md`), người nhận và module.
2. Tạo `docs/handoff/handoffs/<module>-<nguoi-gui>-to-<nguoi-nhan>.md` theo mẫu `docs/handoff/handoffs/_MAU.md`:
   - đã xong gì (UC, endpoint, component);
   - cách chạy, cách dùng (ví dụ code ngắn hoặc request mẫu);
   - dữ liệu mẫu, tài khoản seed;
   - việc còn thiếu;
   - rủi ro;
   - link PR.
3. Lấy thông tin từ `git log` và diff của nhánh hiện tại. Không viết điều chưa kiểm chứng.
4. Cập nhật dòng tương ứng trong `docs/handoff/STATUS.md`.
5. Soạn tin nhắn ngắn (3–4 dòng) để người dùng gửi người nhận trong nhóm chat, kèm đường dẫn file bàn giao.
