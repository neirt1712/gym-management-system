---
paths:
  - "frontend/src/**/*.{ts,tsx,css}"
---

# Vibe giao diện chung (Sơn và Bằng phải ra cùng một kiểu)

Tinh thần: sáng, gọn, nhiều khoảng trắng, một màu nhấn xanh ngọc. Giống phần mềm quản lý dễ dùng cho nhân viên quầy, không giống trang quảng cáo.

## Token (không viết mã màu hay số đo rời trong component)

- Lấy màu, bo góc, cỡ chữ từ `theme/tokens.ts` qua `theme.useToken()` hoặc theme của Ant Design. Không viết hex trong `.tsx`.
- Khoảng cách theo bội số của 8 (`space.sm` = 8, `md` = 16, `lg` = 24, `xl` = 32).
- Màu nhấn chỉ dùng cho nút chính, link và trạng thái đang chọn. Một màn hình chỉ có **một** nút primary.
- Màu trạng thái lấy từ `theme/status.ts`. Không tự chọn màu cho Tag.

## Bố cục một trang

1. `PageHeader`: tiêu đề (danh từ, ví dụ "Lịch tập"), một dòng mô tả ngắn nếu cần, nút chính ở góc phải.
2. Thanh lọc nằm ngay dưới header: ô tìm kiếm bên trái, bộ lọc ở giữa, nút "Đặt lại" bên phải.
3. Nội dung: `DataTable` cho danh sách, `Card` cho chi tiết, dạng hai cột trên màn rộng (thông tin chính 2/3, hành động và tóm tắt 1/3).
4. Điện thoại (< 768px): một cột; bảng chuyển thành danh sách thẻ; nút chính dính đáy màn.

## Chữ và giọng văn (tiếng Việt)

- Xưng "bạn", câu ngắn, không dấu chấm than, không biểu tượng cảm xúc.
- Nút bắt đầu bằng động từ: "Đặt lịch", "Xác nhận thanh toán", "Đề xuất giờ khác". Không dùng "OK", "Submit".
- Thông báo thành công dùng `message.success`, tối đa 6 chữ: "Đã gửi đề xuất", "Đã lưu".
- Lỗi lấy từ `lib/errors.ts`; luôn nói người dùng làm gì tiếp: "Gói đã hết hạn. Gia hạn để check-in."
- Hành động không hoàn tác được (hủy lịch, khóa tài khoản, hủy lớp): dùng `ConfirmDialog`. Tiêu đề dạng câu hỏi ("Hủy lịch tập này?"), nút đỏ ghi đúng hành động ("Hủy lịch").
- Thuật ngữ cố định: Hội viên, Khách hàng, Huấn luyện viên (PT), Gói tập, Buổi tập, Lịch tập, Đề xuất, Lớp học, Check-in, Bảo lưu, Biên lai. Không dùng từ khác cho cùng khái niệm.

## Định dạng

- Tiền: `1.200.000 ₫` (`formatVND`).
- Ngày: `05/10/2026`. Giờ: `18:00`. Khoảng giờ: `18:00–19:00, T2 05/10`.
- Số buổi: `Còn 7/12 buổi` (đậm số còn lại).

## Trạng thái màn hình

- Đang tải: Skeleton đúng hình bố cục, không dùng spinner toàn trang.
- Rỗng: `EmptyState` gồm một câu giải thích và một nút dẫn tới hành động ("Bạn chưa có lịch tập nào" + "Đặt lịch với PT").
- Lỗi: `ErrorState` kèm nút "Thử lại".

## Truy cập

- Mọi input có label. Icon-only button có `aria-label`. Không truyền tải thông tin chỉ bằng màu (Tag luôn có chữ).
- Icon chỉ dùng `@ant-design/icons`.
