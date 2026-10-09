# Thiết kế giao diện — cửa vào

- **Chủ thư mục:** Bằng (FE Sub) vẽ và cập nhật; **Sơn (FE Lead) duyệt và chốt** (Q19).
- **Ai đọc:** Sơn, Bằng, Claude (khi dựng màn, khi chạy `/impeccable`), Huy Trường (kiểm tra màn đúng thiết kế).
- Đây là **nguồn chuẩn do người chốt**. `PRODUCT.md`, `DESIGN.md` ở gốc repo (impeccable) chỉ được sinh **sau khi chốt**, và phải lấy từ thư mục này.

## Trạng thái thiết kế

| Hạng mục | Trạng thái | Ở đâu |
| --- | --- | --- |
| Phong cách chung (màu, kiểu chữ, độ bo góc) | **Chưa chốt** — đang dùng bộ tạm trong `theme/tokens.ts` | `quyet-dinh.md` |
| Bộ màu | **Chưa chốt** (tạm treo; nền nhạt màu chính đang bị xám, xem `fe-huong-dan-component.md` mục 2.2) | `quyet-dinh.md` |
| Figma 15 màn demo | **Chưa có** (Q4) | `man-hinh.md` |
| Ảnh sơ bộ (mock) | **Chưa có** | `anh/` (tạo khi có ảnh) |
| Hướng dẫn giao diện chi tiết | **Chưa sinh** — sinh bằng `/fe-design-lock` sau khi chốt | `huong-dan-giao-dien.md` (sẽ có) |

Khi còn **Chưa chốt**: chỉ dựng màn theo bố cục và quy tắc chung (`.claude/rules/frontend-ui.md`), không tinh chỉnh màu, chữ, hiệu ứng; `/impeccable` chỉ dùng `audit`, `critique`.

## Các file

| File | Nội dung |
| --- | --- |
| `brief.md` | Brief vẽ Figma: hệ thống làm gì, kịch bản demo, 15 màn, nội dung từng màn, bố cục, chữ, phần không vẽ |
| `man-hinh.md` | Bảng theo dõi 15 màn: Chưa vẽ → Đang vẽ → Chờ duyệt → Đã duyệt → Đã code, link frame Figma |
| `quyet-dinh.md` | Nhật ký quyết định giao diện: đã chốt gì, đang chờ gì, ai chốt, ngày |
| `anh/` | Ảnh sơ bộ và ảnh chốt (PNG, đặt tên theo `man-hinh.md`) — tạo khi có ảnh đầu tiên |
| `huong-dan-giao-dien.md` | Hướng dẫn chi tiết (bộ màu đầy đủ, chữ, khoảng cách, component, từng màn) — **sinh tự động** bởi `/fe-design-lock`, không viết tay |

Tài liệu liên quan (giữ nguyên chỗ cũ): token và màu trong code `frontend/src/theme/tokens.ts`, `status.ts` · quy tắc cho Claude `.claude/rules/frontend-ui.md` · hướng dẫn component cho người mới `docs/design/fe-huong-dan-component.md` · bản đồ route `docs/design/fe-architecture.md`.

## Quy trình

```
1. Bằng vẽ Figma theo brief.md            → cập nhật man-hinh.md (Đang vẽ, link frame)
2. Bằng xuất ảnh sơ bộ vào anh/            → man-hinh.md: Chờ duyệt
3. Sơn duyệt từng màn                      → man-hinh.md: Đã duyệt (hoặc ghi chỗ cần sửa)
4. Sơn chốt bộ màu + phong cách            → ghi vào quyet-dinh.md (ngày, mã màu, lý do)
5. Sơn chạy /fe-design-lock                 → sinh huong-dan-giao-dien.md (+ .docx), đề xuất sửa tokens.ts,
                                              cập nhật frontend-ui.md, fe-huong-dan-component.md, sinh DESIGN.md (impeccable),
                                              đổi trạng thái ở bảng trên thành "Đã chốt"
6. Bằng duyệt đề xuất tokens.ts (theme là của Bằng) → PR; từ đây dựng màn theo hướng dẫn chi tiết
```

Đổi thiết kế sau khi chốt: ghi một mục mới trong `quyet-dinh.md` (không xóa mục cũ), rồi chạy lại `/fe-design-lock`.
