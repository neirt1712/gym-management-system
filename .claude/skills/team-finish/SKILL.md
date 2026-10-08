---
name: team-finish
description: Kết thúc một task trong dự án gym. Chạy kiểm tra thật (lint, typecheck, test, build), đối chiếu spec, cập nhật STATUS và CONTRACT_STATUS, soạn commit và mô tả PR theo mẫu. Dùng khi người dùng gõ /team-finish hoặc nói xong task, chuẩn bị PR.
---

# Kết thúc task

1. **Chạy kiểm tra** trong thư mục đã sửa (`frontend/` hoặc `backend/`): `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. Ghi kết quả thật của từng lệnh. Lệnh lỗi thì báo lỗi, không nói là đạt.
2. **Đối chiếu spec:** giao cho subagent `spec-checker` các file đã đổi (`git diff --name-only develop...HEAD`) và mã UC. Nhận lại danh sách chỗ lệch.
3. **Rà chuẩn nhóm:** FE dùng checklist của `fe-ui-check`; BE dùng checklist của `be-check`. Chỉ liệt kê lỗi, không tự sửa nếu chưa được bảo.
4. **Cập nhật tài liệu** (trong phạm vi người dùng được sửa):
   - `docs/handoff/STATUS.md`: dòng của mình (đã xong, đang làm, đang vướng);
   - `docs/handoff/CONTRACT_STATUS.md` nếu endpoint đổi trạng thái (BE: Real; FE: đã chuyển sang Real).
5. **Soạn commit** theo Conventional Commits có mã UC, ví dụ `feat(fe): UC12 trang kết quả VNPay`. Chỉ commit khi người dùng đồng ý; không push.
6. **Soạn mô tả PR** theo `.github/PULL_REQUEST_TEMPLATE.md`.
7. **Có người phụ thuộc** (Bằng dùng component, FE chờ endpoint…): gợi ý chạy `/team-handoff`.
8. **Báo cáo cuối theo mẫu:** Đã làm · File thay đổi · Cách kiểm tra (kèm kết quả lệnh) · Rủi ro và giả định · Cần ai làm tiếp.
