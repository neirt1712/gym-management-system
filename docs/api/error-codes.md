# Danh mục mã lỗi

- **Ai sở hữu:** Hồng Anh (thêm mã mới qua PR; Triển cập nhật openapi.yaml cùng lúc).
- **Ai đọc:** BE (`common/errors/codes.ts`), FE (`frontend/src/lib/errors.ts`), Huy Trường (test case).
- **Nguyên tắc:**
  - FE xử lý theo `code`, không theo `message`.
  - Câu cho người dùng nằm ở cột "Thông điệp FE"; câu luôn nói người dùng làm gì tiếp.
  - Mọi lỗi có `requestId`; FE hiện mã này trong phần chi tiết lỗi để truy vết.

| code | HTTP | Khi nào | Thông điệp FE |
| --- | --- | --- | --- |
| VALIDATION_ERROR | 400 | Sai cú pháp hoặc thiếu field (`details` liệt kê field) | Thông tin chưa hợp lệ. Kiểm tra các ô được đánh dấu. |
| UNAUTHENTICATED | 401 | Chưa đăng nhập hoặc token hết hạn | (FE tự gọi refresh; thất bại thì về trang đăng nhập) |
| FORBIDDEN | 403 | Sai vai trò hoặc không sở hữu tài nguyên | Bạn không có quyền thực hiện thao tác này. |
| NOT_FOUND | 404 | Không thấy tài nguyên | Không tìm thấy dữ liệu. Có thể đã bị xóa hoặc bạn không có quyền xem. |
| INVALID_CREDENTIALS | 401 | Sai tài khoản hoặc mật khẩu | Sai tài khoản hoặc mật khẩu. |
| ACCOUNT_LOCKED | 403 | Admin đã khóa tài khoản | Tài khoản đã bị khóa. Liên hệ quầy để được hỗ trợ. |
| ACCOUNT_TEMPORARILY_LOCKED | 429 | Đăng nhập sai 5 lần (`details.retryAfterSeconds`) | Bạn đăng nhập sai nhiều lần. Thử lại sau ít phút. |
| ACTIVATION_REQUIRED | 409 | Đăng ký trùng SĐT của hồ sơ tạo tại quầy chưa kích hoạt | Số điện thoại này đã có hồ sơ tại quầy. Kích hoạt tài khoản để tiếp tục. |
| PHONE_DUPLICATED | 409 | SĐT đã dùng (`details.memberId` nếu là hội viên) | Số điện thoại đã được dùng. |
| EMAIL_DUPLICATED | 409 | Email đã dùng | Email đã được dùng. |
| TOKEN_EXPIRED | 400 | Link đặt mật khẩu hết hạn hoặc đã dùng | Liên kết đã hết hạn. Gửi lại yêu cầu đặt mật khẩu. |
| INVALID_FILE | 422 | Ảnh không phải JPEG/PNG | Chỉ nhận ảnh JPEG hoặc PNG. |
| PENDING_ORDER_EXISTS | 409 | Đã có đơn PENDING cùng gói (`details.orderId`) | Bạn đang có đơn chờ thanh toán cho gói này. Mở lại đơn đó để thanh toán. |
| CASH_AMOUNT_MISMATCH | 422 | Tiền nhận khác số tiền cần thu | Số tiền nhận phải bằng số tiền cần thanh toán. |
| NO_ACTIVE_SUBSCRIPTION | 422 | Check-in khi không có gói có quyền vào phòng | Hội viên chưa có gói còn hiệu lực. Mua hoặc gia hạn gói để check-in. |
| SUBSCRIPTION_EXPIRED | 422 | Gói đã hết hạn | Gói đã hết hạn. Gia hạn để check-in. |
| SUBSCRIPTION_FROZEN | 422 | Gói đang bảo lưu | Gói đang bảo lưu. Mở lại gói để check-in. |
| SUBSCRIPTION_NOT_ACTIVE | 409 | Bảo lưu gói không ở trạng thái ACTIVE | Chỉ bảo lưu được gói đang hiệu lực. |
| SUBSCRIPTION_NOT_FROZEN | 409 | Mở lại gói không đang bảo lưu | Gói này không ở trạng thái bảo lưu. |
| ALREADY_CHECKED_IN | 409 | Hội viên còn lượt chưa check-out | Hội viên đang trong phòng tập. Check-out lượt trước trước. |
| INVALID_QR | 422 | QR không hợp lệ | Không nhận ra mã QR. Thử nhập số điện thoại. |
| FREEZE_BLOCKED_BY_APPOINTMENTS | 409 | Gói còn lịch tương lai (`details.appointmentIds`) | Gói còn lịch tập sắp tới. Hủy hoặc hoàn tất các lịch đó trước khi bảo lưu. |
| SCHEDULE_CONFLICT | 409 | Trùng lịch PT, hội viên hoặc lớp của PT | Khung giờ này bị trùng lịch. Chọn giờ khác. |
| STALE_VERSION | 409 | `expectedVersion` cũ | Lịch vừa được bên kia cập nhật. Xem lại đề xuất mới nhất. |
| NO_SESSIONS_AVAILABLE | 422 | Hết buổi có thể đặt | Gói đã hết buổi có thể đặt. |
| OUTSIDE_SUBSCRIPTION_PERIOD | 422 | Giờ đề xuất ngoài thời hạn gói | Giờ đề xuất nằm ngoài thời hạn gói. |
| SESSION_NOT_ENDED | 422 | Xác nhận buổi khi chưa qua giờ kết thúc | Buổi tập chưa kết thúc nên chưa xác nhận được. |
| NO_CLASS_BENEFIT | 422 | Gói không có quyền vào lớp | Gói của bạn không gồm quyền tham gia lớp học. |
| CLASS_FULL | 409 | Lớp đủ chỗ | Lớp đã đủ chỗ. |
| CANCELLATION_WINDOW_PASSED | 422 | Quá hạn hủy đăng ký lớp | Đã quá hạn hủy đăng ký lớp này. |
| ROLE_CHANGE_NOT_ALLOWED | 422 | Đổi vai trò từ/sang MEMBER, hoặc PT còn lịch/lớp tương lai | Không đổi được vai trò cho tài khoản này. |
| RATE_LIMITED | 429 | Gọi quá nhiều lần (quên mật khẩu…) | Bạn thao tác quá nhanh. Thử lại sau ít phút. |
| INTERNAL_ERROR | 500 | Lỗi không lường trước | Có lỗi xảy ra. Thử lại sau. |
