# Tiếp tục việc thiết kế giao diện (đọc đầu tiên)

- **Để làm gì:** mở đoạn chat mới (Claude Code hoặc Claude web) thì đọc file này là đủ ngữ cảnh, không cần kể lại.
- **Ai cập nhật:** người vừa làm xong một lượt việc thiết kế sửa mục 2, 3, 4. Giữ dưới 80 dòng; chi tiết nằm ở file được trỏ tới.
- Cập nhật lần cuối: 10/10/2026 (Sơn).

## 1. Đọc gì, theo thứ tự

1. File này.
2. `quyet-dinh.md`: cái gì đã chốt (UI-01 → UI-11), cái gì đang chờ (UI-P1, P3, P4).
3. `mock/index.html` + `mock/styles.css`: mock chuẩn, 57 màn. Màu, font, animation đều nằm trong `styles.css` (lớp cuối cùng "BỘ 6 MÀU" thắng các lớp cũ phía trên).
4. Cần nội dung một màn: `brief.md` mục 4; cần tên trường: `docs/api/openapi.yaml`; cần UC: `docs/spec/use-cases-v3.md`.

## 2. Đã chốt (không bàn lại)

- Bộ 6 màu (UI-09); chữ trên nền xanh lá luôn là xanh than.
- Font: Oswald (tiêu đề, viết hoa) + Be Vietnam Pro.
- Animation kiểu thể thao: bật nhanh hãm gọn (`--ease`), nhịp "một rep" (`--ease-rep`); **không** nảy, đàn hồi, lắc lư, chữ chạy vô hạn (UI-10).
- Không dùng: vạch màu dày ở cạnh thẻ, nhãn vai trò nhỏ đặt trên tiêu đề ("QUẢN TRỊ", "QUẦY"…), nền sọc toàn trang.
- **Mock chỉ là demo.** Khi code màn thật: lấy mock làm gốc, dùng `/impeccable` để hoàn thiện, không chép nguyên HTML/CSS; trường dữ liệu và endpoint theo `openapi.yaml`, không theo dòng chú thích "GET /..." trong mock (UI-13).
- Ảnh để trống (`data-anh="cho-cap-nhat"`), nhóm cập nhật sau.

## 3. Đang ở đâu

- Nhánh `tsonw1-design-mock`. Đã rà 44 màn đầu qua `/impeccable animate` và bộ dò. 13 màn bổ sung từ Claude web đã nhập (UI-14), mới chuyển định dạng và bỏ nhãn vai trò, chưa rà kỹ.
- **Chưa ai xem bằng mắt trên trình duyệt** sau khi sửa. `frontend/src/theme/tokens.ts` chưa đổi (đợi `/fe-design-lock`).
- Cảnh báo còn lại, cố ý chưa sửa:
  - 43 ảnh trống (chờ ảnh).
  - 91 báo vạch tốc độ `.speed` ở đầu trang chủ: giữ, đây là điểm nhấn thể thao duy nhất.
  - 22 thẻ lồng thẻ, 15 bảng sát viền khung: phải sửa cấu trúc từng màn, làm khi bổ sung màn.
  - 4 nhãn có thông tin thật (ngày, mã đơn) và 4 ô biểu tượng trên tiêu đề (Giới thiệu, Kết quả).
  - Trang chủ: 1 chỗ chữ xám trên nền xanh lá chưa tìm ra; vài chữ trang trí bị báo tương phản (không phải nội dung).
- Chạy lại bộ dò: `.claude/skills/impeccable/scripts/impeccable detect --json docs/design/ui/mock`.

## 4. Màn bổ sung (đã nhập 10/10, UI-12 và UI-14)

| Nhóm | File trong `mock/` |
| --- | --- |
| Cần cho demo 30/10 | `TrangThai.html` (tải / rỗng / lỗi / toast), `DangNhapKhoa.html` |
| Chưa cần cho demo, để sẵn | `GoiCuaToi`, `LichSuRaVao`, `GiaoDich`, `QuanTriPT`, `ChiTietDon`, `Loi403`, `Loi404` |
| Bản điện thoại 390px | `DTTrangChu`, `DTDangNhap`, `DTTongQuan`, `DTLichTap` |

Artifact gốc trên Claude web: `https://claude.ai/artifact/QzuKgGqxu3yKF8nSxCPo2G`. Repo **không** chép đè 44 màn cũ từ artifact (artifact chưa có các sửa đổi theo impeccable). Lấy màn mới về: chỉ nhập file chưa có trong `mock/`.

## 5. Nhờ Claude web làm thêm màn

Dán kèm file này và `quyet-dinh.md`. Yêu cầu: dùng đúng class có sẵn, tuân thủ mục 2, không bịa trường dữ liệu hay nút ngoài `brief.md`; kết quả chỉ là đề xuất, Sơn nhập về repo rồi chạy bộ dò.

## 6. Việc kế tiếp

1. Sơn, Bằng mở `mock/index.html` xem thử (Trang chủ, Check-in, Tổng quan).
2. Nhóm gửi ảnh thật.
3. Sơn chốt UI-P1, UI-P4 rồi chạy `/fe-design-lock`; Bằng đổi `tokens.ts`, thêm font Oswald.
