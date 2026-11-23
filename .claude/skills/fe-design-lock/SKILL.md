---
name: fe-design-lock
description: Chốt thiết kế giao diện của dự án gym. Từ ảnh sơ bộ trong docs/design/ui/anh/ và bộ màu, phong cách đã chốt trong docs/design/ui/quyet-dinh.md, sinh hướng dẫn giao diện chi tiết (huong-dan-giao-dien.md + Word), đề xuất sửa theme/tokens.ts, cập nhật quy tắc FE và DESIGN.md. Chỉ chạy khi Sơn gõ /fe-design-lock.
disable-model-invocation: true
argument-hint: "[ghi chú: phạm vi chốt, ví dụ 'bộ màu + 15 màn demo']"
---

# Chốt thiết kế giao diện

Đầu vào: $ARGUMENTS. Nguồn chuẩn: `docs/design/ui/` (đọc `README.md` trước). Người chốt: Sơn. Chủ `frontend/src/theme/`: Bằng.

## 1. Kiểm tra đủ điều kiện (dừng nếu thiếu)

- `docs/design/ui/quyet-dinh.md`: bộ màu (UI-P2) và phong cách (UI-P1) đã chuyển sang bảng **Đã chốt**, có mã màu cụ thể cho 10 màu gốc của `theme/tokens.ts` (primary, success, warning, error, info, bgLayout, bgContainer, border, text, textSecondary). Chưa có thì hỏi Sơn, không tự chọn màu.
- `docs/design/ui/anh/`: có ảnh sơ bộ các màn; `man-hinh.md` ghi màn nào **Đã duyệt**. Màn chưa duyệt thì không đưa vào hướng dẫn chi tiết, chỉ liệt kê "chưa duyệt".
- Xem từng ảnh (đọc file ảnh). Ghi lại điều nhìn thấy (bố cục, mật độ, kiểu thẻ, kiểu bảng, nút, khoảng trắng) bằng lời của mình trước khi đọc mô tả khác.

## 2. Đối chiếu, không bịa

- Ảnh hoặc quyết định trái `docs/spec/*`, `docs/api/openapi.yaml` (trường dữ liệu, màn ngoài phạm vi) hoặc `.claude/rules/frontend-ui.md` (Ant Design, một nút primary, 4 trạng thái, chữ tiếng Việt): liệt kê chỗ lệch và hỏi Sơn chọn. Không tự sửa spec.
- Kiểm tra độ tương phản chữ/nền của bộ màu mới (chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1). Không đạt thì báo kèm màu đề xuất, Sơn chốt.
- Tính sắc độ Ant Design tự sinh từ màu mới (`theme.getDesignToken` trong `frontend/`); nền nhạt (`colorPrimaryBg`, `colorSuccessBg`…) bị xám đục thì đề xuất ghi đè (đã gặp ở bộ màu tạm, xem `fe-huong-dan-component.md` mục 2.2).

## 3. Sinh hướng dẫn chi tiết

Viết `docs/design/ui/huong-dan-giao-dien.md` (đầu file ghi: sinh bởi `/fe-design-lock` ngày …, từ quyết định UI-xx; không sửa tay), gồm:

1. **Bộ màu đầy đủ:** 10 màu gốc, sắc độ hover/active/nền/viền thật (tính từ theme), màu trạng thái, tương phản đã kiểm, quy tắc dùng màu.
2. **Chữ:** font, cỡ chữ từng cấp (tiêu đề trang, tiêu đề thẻ, chữ thường, chữ phụ), độ đậm.
3. **Khoảng cách, bo góc, đổ bóng, đường viền** theo token.
4. **Component dùng chung** (PageHeader, DataTable, FormModal, StatusTag, EmptyState, ErrorState, ConfirmDialog): hình dạng theo ảnh đã duyệt, props trong `fe-huong-dan-component.md` mục 5.
5. **Từng màn đã duyệt:** ảnh (`anh/…`), bố cục, thành phần, trạng thái (tải, rỗng, lỗi, 403), bản điện thoại; trỏ tới nội dung trong `brief.md`.
6. **Checklist duyệt màn** để Sơn review PR (mở rộng mục 9 của `fe-huong-dan-component.md`).

Xuất Word: `node tools/report-docx/md2docx.mjs docs/design/ui/huong-dan-giao-dien.md`.

## 4. Cập nhật nơi khác (hiện từng thay đổi, chờ Sơn đồng ý)

- `frontend/src/theme/tokens.ts`: **chỉ đề xuất** dạng patch (thuộc Bằng); soạn tin nhắn để Bằng duyệt và áp vào PR của Bằng hoặc PR này nếu Bằng đồng ý.
- `docs/design/ui/README.md`: bảng Trạng thái chuyển "Đã chốt" (ghi ngày, quyết định UI-xx).
- `.claude/rules/frontend-ui.md`: xóa dòng "Mẫu thiết kế chưa chốt…" trong mục `/impeccable`; thêm điểm mới của phong cách đã chốt (ngắn, trỏ tới `huong-dan-giao-dien.md`, không chép lại).
- `docs/design/fe-huong-dan-component.md` mục 2 (bộ màu): thay bảng màu tạm bằng trỏ tới `huong-dan-giao-dien.md`.
- Sau khi các file trên đã cập nhật: chạy `/impeccable document` để sinh `DESIGN.md` ở gốc repo **từ hướng dẫn vừa sinh** (không để impeccable tự suy diễn phong cách khác).

## 5. Kết thúc

- Chạy `npm run lint && npm run typecheck && npm run test && npm run build` trong `frontend/` nếu có đổi `tokens.ts`; báo kết quả thật.
- Soạn commit (chỉ commit khi Sơn đồng ý, không push): nhánh `tsonw<N>-design-lock`, `docs(design): chốt thiết kế giao diện, sinh hướng dẫn chi tiết`.
- Soạn tin nhắn nhóm chat ≤ 10 dòng: đã chốt gì, file hướng dẫn ở đâu (kèm Word), Bằng cần duyệt `tokens.ts`, từ nay dựng màn theo hướng dẫn chi tiết, `/impeccable` dùng đầy đủ.
