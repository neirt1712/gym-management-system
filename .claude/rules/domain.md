# Quy tắc nghiệp vụ cốt lõi (không được phá)

Nguồn đầy đủ: `docs/spec/decisions.md` và `docs/spec/erd-v3.md`. Đây chỉ là bản nhắc ngắn.

- Khách hàng = tài khoản MEMBER chưa có gói ACTIVE. Hội viên = có ít nhất 1 gói ACTIVE. Không lưu cột này, luôn tính ra.
- Gói hội viên (`subscriptions`) chỉ sinh ra khi thanh toán SUCCESS. Đơn PAID, receipt_no, subscription và thông báo được tạo trong cùng một transaction.
- Đơn chụp lại điều khoản gói lúc tạo. Admin sửa giá gói sau đó không ảnh hưởng đơn và gói đã có.
- Thanh toán chỉ VNPay sandbox và tiền mặt. FE không tự đánh dấu đã trả từ return URL; luôn đọc `GET /orders/{id}`.
- Số buổi PT không lưu thành cột:
  - đã tập = COMPLETED + NO_SHOW;
  - đang giữ = PENDING + CONFIRMED;
  - còn lại = tổng − đã tập;
  - có thể đặt = còn lại − đang giữ.
- Lịch PT là thỏa thuận giữa hai bên. Mọi thay đổi đều là một đề xuất (`kind`: INITIAL, COUNTER, RESCHEDULE, CANCEL). Bên đang được hỏi mới được accept/reject. Mọi hành động gửi kèm `expectedVersion`.
- Đổi/hủy lịch đã CONFIRMED phải được bên kia đồng ý; trong lúc chờ, lịch cũ giữ nguyên.
- Chỉ PT phụ trách hoặc Admin xác nhận buổi tập (COMPLETED hoặc NO_SHOW), và chỉ sau giờ kết thúc. Cả hai đều trừ 1 buổi.
- Check-in không trừ buổi PT. Mỗi hội viên chỉ có 1 lượt chưa check-out. Job 23:59 tự đóng các lượt còn mở.
- Bảo lưu tối đa 1 lần/gói, 30 ngày. Bị chặn nếu gói còn lịch tương lai. Mở lại thì cộng số ngày bảo lưu vào `ends_on`.
- Lớp học: cần gói ACTIVE có `includes_class`; không vượt sức chứa; chỉ hủy được trước hạn hủy.
- Ngoài phạm vi: nâng cấp gói, mã giảm giá, điểm thưởng, hoàn tiền, SMS, hóa đơn điện tử, MoMo (chỉ làm nếu dư thời gian).
