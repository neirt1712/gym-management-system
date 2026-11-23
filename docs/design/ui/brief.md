# Brief vẽ Figma — demo lần 1

- **Cho:** Bằng (vẽ Figma). **Người soạn:** Sơn. **Bản gốc:** file Word gửi ngày 07/10; bản này cập nhật theo Q12, Q14, Q15 và openapi v0.1.
- **Mục tiêu đầu tiên:** wireframe (đúng nội dung, đúng bố cục), chưa cần đẹp. **Phong cách chưa chốt** (`quyet-dinh.md` UI-P1, UI-P2): dùng Style/Variable trong Figma cho màu và chữ để đổi một chỗ là cả file đổi theo.
- Chỉ vẽ những gì có ở đây; thấy thiếu thì hỏi Sơn. Tên trường dữ liệu chính xác nằm trong `docs/api/openapi.yaml`.

## 1. Hệ thống làm gì

Phần mềm quản lý phòng gym. Khách xem gói tập, mua gói, thanh toán, thành **hội viên**; hội viên check-in khi tới tập, đặt lịch với huấn luyện viên (PT), đăng ký lớp. Nhân viên quầy hỗ trợ tại chỗ; quản trị viên quản lý gói, tài khoản, báo cáo.

| Vai trò | Là ai | Thiết bị chính |
| --- | --- | --- |
| Hội viên (Member) | Khách có tài khoản; có gói còn hiệu lực thì là hội viên | Điện thoại |
| Huấn luyện viên (PT) | Nhận lịch tập, theo dõi hội viên | Điện thoại, máy tính |
| Nhân viên quầy (Staff) | Thêm hội viên, bán gói, thu tiền mặt, check-in | Máy tính bảng, máy tính ở quầy |
| Quản trị (Admin) | Quản lý gói, tài khoản, báo cáo | Máy tính |

Vòng đời chính: tài khoản → đơn hàng → thanh toán → gói hội viên → check-in.

## 2. Kịch bản demo 30–31/10

1. Admin đăng nhập, tạo gói "PT 12 buổi / 3 tháng" kèm quyền lợi, tạo tài khoản Staff và PT.
2. Khách tự đăng ký, xem danh sách gói, lọc theo giá, so sánh hai gói.
3. Khách mua gói, thanh toán VNPay (hoặc tiền mặt để Staff xác nhận), nhận thông báo và biên lai.
4. Hội viên xem "Gói của tôi": ngày bắt đầu, ngày kết thúc, 12/12 buổi; mở mã QR.
5. Staff tạo hồ sơ một khách tại quầy, mua gói hộ bằng tiền mặt.
6. Staff quét QR để check-in; thử một người hết hạn để thấy lỗi; xem danh sách đang tập, check-out.
7. Admin khóa một tài khoản, tài khoản đó bị đăng xuất.

## 3. Mười lăm màn cần vẽ

Danh sách và trạng thái: `man-hinh.md`. Bằng vẽ **tất cả** để giao diện thống nhất (cột "Người code" chỉ cho biết ai dựng màn sau này).

## 4. Nội dung từng màn

### 1. Đăng nhập
- Ô **"Số điện thoại"** (chỉ SĐT, Q12), ô "Mật khẩu", nút "Đăng nhập". Link "Quên mật khẩu", "Tạo tài khoản".
- Lỗi trên form: sai mật khẩu, tài khoản bị khóa, đăng nhập sai nhiều lần (khóa tạm, nút bị khóa trong thời gian chờ).
- Đã có bản chạy thật trong app; Figma chỉ cần chỉnh cho đẹp.

### 2. Đăng ký
- Ô theo openapi: họ tên, số điện thoại, **email (không bắt buộc, Q15)**, ngày sinh (không bắt buộc), mật khẩu.
- Ghi chú dưới ô email: có email thì tự lấy lại mật khẩu được; không có thì đến quầy.
- SĐT đã có hồ sơ tạo tại quầy: báo "kích hoạt tài khoản" thay vì lỗi trùng.
- Đăng ký xong thì vào luôn (không phải đăng nhập lại).

### 3. Trang chủ
- Giới thiệu ngắn phòng gym, nút dẫn tới "Gói tập" và "Huấn luyện viên". Header công khai: logo, menu, nút "Đăng nhập".

### 4. Danh mục gói
- Mỗi gói một thẻ: tên, loại (Gym hoặc PT), giá, thời hạn (ngày/tháng), số buổi PT (chỉ gói PT), quyền lợi dạng danh sách, có vào lớp hay không.
- Thanh lọc: tìm theo tên, loại, khoảng giá, thời hạn. Chọn 2 gói để so sánh cạnh nhau.

### 5. Chi tiết gói
- Toàn bộ thông tin gói, mô tả, quyền lợi. Nút "Mua gói" (chưa đăng nhập thì chuyển sang đăng nhập).

### 6. Mua gói
- Thanh bước: chọn ngày bắt đầu → xem báo giá (giá, **ngày kết thúc do hệ thống tính**, Q9) → tạo đơn → chọn phương thức (VNPay hoặc tiền mặt).
- Đã có đơn chờ thanh toán cùng gói: thông báo và nút "Mở đơn đang chờ".
- Đây cũng là component `PurchaseFlow` quầy dùng lại để mua hộ.

### 7. Kết quả thanh toán
- 3 trạng thái: đang chờ xác nhận (chỉ báo đang kiểm tra), thành công, thất bại (nút thử lại).
- Thành công: biên lai (số biên lai, gói, số tiền, thời gian), nút "In biên lai".

### 8. Tổng quan hội viên
- Thẻ "Gói của tôi": tên gói, trạng thái, ngày bắt đầu, ngày kết thúc, số buổi tổng / đã tập / còn lại (gói PT).
- Mã QR cá nhân để check-in (mở to được), nút **tạo lại mã khi bị lộ** (Q6).
- Lịch sắp tới: để chỗ trống (làm sau demo). Chưa có gói: trạng thái rỗng + nút "Xem gói tập".

### 9. Admin: quản lý gói
- Bảng gói: tên, loại, giá, thời hạn, số buổi, trạng thái bán.
- Form thêm/sửa (FormModal): các trường của màn 4; quyền lợi là danh sách thêm/xóa từng dòng; công tắc "Đang bán", "Vào lớp".

### 10. Admin: tài khoản
- Bảng tài khoản: họ tên, SĐT, email, vai trò, trạng thái.
- Tạo tài khoản Staff hoặc PT (PT thêm chuyên môn, kinh nghiệm, giới thiệu). Khóa / mở khóa (ConfirmDialog), đổi vai trò kèm lý do.

### 11. Quầy: danh sách hội viên
- Ô tìm kiếm to, tự focus: tên (không dấu), SĐT hoặc mã hội viên. Bảng: mã, họ tên, SĐT, gói đang có, trạng thái.
- Nút "Thêm hội viên" (không cần mật khẩu; **email không bắt buộc**, Q15).
- **Admin dùng chung màn này** qua mục menu "Hội viên" (Q14).

### 12. Quầy: chi tiết hội viên
- Thông tin hội viên, danh sách gói (StatusTag), lịch sử ra vào.
- Nút "Mua gói hộ" (mở PurchaseFlow); nút **"Đặt lại mật khẩu"** cho khách không có email, sau khi đối chiếu SĐT (Q15); nút "Bảo lưu" (sau demo); nút "Đặt lịch PT hộ" (tuần 5–6, Q14).

### 13. Quầy: xác nhận tiền mặt
- Danh sách đơn tiền mặt đang chờ, giao dịch trong ngày.
- Xác nhận: nhập số tiền nhận (phải bằng số cần thu), ConfirmDialog, khóa nút khi đang gửi.

### 14. Quầy: check-in
- Hai cách: khung camera quét QR, hoặc ô nhập SĐT rồi Enter.
- Kết quả hiện **chữ to**: thành công (tên, gói, hạn), cảnh báo gói sắp hết hạn, lỗi (không có gói, hết hạn, đang bảo lưu, đang trong phòng).
- Danh sách "Đang tập" bên dưới, nút "Check-out" từng người. Thiết kế cho máy tính bảng.

### 15. Thông báo
- Chuông ở header có số chưa đọc. Danh sách: tiêu đề, nội dung ngắn, thời gian, đánh dấu đã đọc.

## 5. Khung trang và bố cục

- **Khung sau đăng nhập (đã có trong app):** menu trái 232px, logo "Phòng gym", mục menu theo vai trò; điện thoại thì menu thu gọn. Thanh trên: tên, vai trò, menu tài khoản. Nền trang xám rất nhạt, nội dung trong thẻ trắng.
- **Một trang:** tiêu đề (danh từ) + mô tả ngắn + nút chính bên phải → thanh lọc (tìm kiếm trái, bộ lọc giữa, "Đặt lại" phải) → nội dung (bảng cho danh sách; thẻ cho chi tiết, 2 cột 2/3 + 1/3 trên màn rộng). Điện thoại (< 768px): một cột, bảng thành danh sách thẻ, nút chính dính đáy.
- **Bốn trạng thái:** đang tải (khung xám đúng bố cục), rỗng (câu giải thích + nút), lỗi (câu nói làm gì tiếp + "Thử lại" + mã yêu cầu chữ nhỏ), không có quyền (403 có sẵn). Vẽ đủ 4 cho một màn danh sách (gợi ý màn 11); màn khác vẽ trạng thái chính + rỗng.
- **Component dùng chung** (vẽ thành Component trong Figma): PageHeader, DataTable, FormModal, StatusTag, EmptyState, ErrorState, ConfirmDialog. Chi tiết props: `docs/design/fe-huong-dan-component.md` mục 5.

## 6. Làm Figma

1. File "Gym – Demo 1", các trang: 00 Bìa · 01 Luồng · 02 Desktop · 03 Mobile · 04 Component.
2. Dùng bộ **Ant Design** từ Figma Community (code dùng Ant Design 5).
3. Frame: máy tính 1440 × 900, máy tính bảng 1024 × 768 (màn 14), điện thoại 390 × 844.
4. Lưới 8px; mọi khoảng cách là bội số của 8; Auto Layout cho thẻ, form, danh sách.
5. Color Styles và Text Styles theo `quyet-dinh.md` (đang tạm), để đổi một chỗ là cả file đổi.
6. Tên frame: số màn + đường dẫn, ví dụ "11 · /staff/members" (điện thoại thêm "· mobile").
7. Dữ liệu mẫu giống thật (tên người Việt, SĐT 09xx, giá 1.200.000 ₫), không "Lorem ipsum".
8. Xong: chia sẻ link quyền xem/bình luận, ghi vào `man-hinh.md`, xuất ảnh vào `anh/`, báo Sơn duyệt.

## 7. Chữ trên giao diện

Theo `.claude/rules/frontend-ui.md` mục "Chữ và giọng văn": xưng "bạn", nút bắt đầu bằng động từ, thông báo thành công ≤ 6 chữ, lỗi nói làm gì tiếp, hộp hỏi lại có tiêu đề là câu hỏi và nút ghi đúng hành động, tiêu đề trang là danh từ, thuật ngữ cố định. Định dạng: tiền `1.200.000 ₫`, ngày `05/10/2026`, giờ `18:00`, số buổi `Còn 7/12 buổi`.

## 8. Không vẽ (ngoài phạm vi)

Nâng cấp gói, mã giảm giá, điểm thưởng, hoàn tiền, đánh giá PT, SMS, hóa đơn điện tử, lớp lặp hằng tuần, màn xem nhật ký hệ thống, MoMo. Lịch PT và lớp học chưa vào demo 1 (vẽ ở đợt 25/10).

## 9. Kiểm tra trước khi gửi Sơn duyệt

- Đủ 15 màn bản máy tính; màn hội viên và check-in có thêm bản điện thoại / máy tính bảng.
- Có trang Luồng nối các màn theo kịch bản mục 2.
- Nội dung đúng mục 4, không có ô nhập hay nút lạ.
- Một màn danh sách đủ 4 trạng thái; màn khác có trạng thái rỗng.
- Màu và chữ dùng Style; khoảng cách bội số 8; một nút màu chính mỗi màn.
- Chữ đúng mục 7, dữ liệu mẫu tiếng Việt; 7 component ở trang 04.
