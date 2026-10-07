---
name: team-week-close
description: Chốt tuần của nhóm gym, cầu nối giữa Claude Code và Claude web. "xuat": gom 5 báo cáo tuần thành gói dán lên Claude web để tổng hợp, tối ưu, tập hợp ý kiến. "nhap": nhận câu trả lời của Claude web, ghi vào OPEN_QUESTIONS, STATUS, bản chốt tuần và 5 prompt tuần sau. Sơn chạy. Dùng khi người dùng gõ /team-week-close hoặc nói chốt tuần, xuất gói Claude web, nhập kết quả Claude web.
argument-hint: "xuat|nhap [số tuần, bỏ trống = tuần vừa qua]"
---

# Chốt tuần (cầu nối Claude Code ↔ Claude web)

Đầu vào: $ARGUMENTS. Chế độ `xuat` hoặc `nhap`; số tuần N (bỏ trống thì là tuần vừa kết thúc, tuần 1 bắt đầu Thứ Hai 05/10/2026).
Người chạy: Sơn. Claude web là tài khoản chung của nhóm.
Quy trình và tên viết tắt: `docs/reports/README.md`. Mẫu: `_MAU-gui-claude-web.md`, `_MAU-chot.md`, `_MAU-tong-hop.md`, `_MAU-prompt.md` trong `docs/reports/`.
Thiếu chế độ thì hỏi người dùng muốn `xuat` hay `nhap`.

## Chế độ `xuat` (Chủ Nhật tối hoặc sáng Thứ Hai, trước họp)

1. `git fetch`, `git switch develop && git pull` (hỏi trước nếu đang có thay đổi chưa commit).
2. Đọc 5 báo cáo `docs/reports/tuan-NN/<ten>.md`. Thiếu ai thì báo tên và hỏi: chờ, hay xuất với phần đang có (ghi "thiếu báo cáo" trong gói).
3. Đối chiếu dữ liệu thật: `docs/plan/fe-plan.md`, `docs/plan/be-plan.md` (tuần N, N+1), `docs/plan/preparation.md`, `docs/handoff/STATUS.md`, `OPEN_QUESTIONS.md`, `CONTRACT_STATUS.md`, `git log origin/develop` trong tuần. Báo cáo ghi "Xong" mà không có bằng chứng thì đánh dấu "cần xác nhận"; không sửa báo cáo của người khác.
4. Viết `docs/reports/tuan-NN/TONG-HOP.md` theo `_MAU-tong-hop.md` (số liệu đếm được, không ước lượng).
5. Viết `docs/reports/tuan-NN/GOI-CLAUDE-WEB.md`, **tự đủ nghĩa** vì Claude web không đọc được repo, gồm theo thứ tự:
   - phần hướng dẫn chép nguyên từ `_MAU-gui-claude-web.md` (điền số tuần);
   - bản chốt tuần trước gần nhất (`docs/reports/tuan-(NN-1)/CHOT-TUAN-(NN-1).md`) hoặc phần bối cảnh của `_MAU-chot.md` nếu chưa có;
   - nội dung `TONG-HOP.md`;
   - nguyên văn 5 báo cáo cá nhân;
   - bảng câu hỏi đang mở (`OPEN_QUESTIONS.md`, có cột Cụm và Ảnh hưởng ai);
   - dòng tuần N+1 của cả 5 người trong kế hoạch;
   - nháp 5 prompt tuần N+1 theo `_MAU-prompt.md`.
6. Báo đường dẫn và kích thước gói. Hướng dẫn người dùng: mở Claude web (tài khoản chung), dán toàn bộ `GOI-CLAUDE-WEB.md` (quá dài thì tải lên như file), chờ trả lời theo khuôn, mang câu trả lời vào họp.
7. Soạn commit (chỉ khi người dùng đồng ý, không push): nhánh `tsonw<N>-week-close`, `docs(report): tuần N tổng hợp và gói Claude web`.

## Chế độ `nhap` (sau họp Thứ Hai, khi nhóm đã duyệt)

1. Hỏi người dùng dán câu trả lời của Claude web (hoặc đường dẫn file đã lưu), và những điểm họp đã sửa hay bác.
2. Kiểm tra câu trả lời có đủ các mục theo khuôn trong `_MAU-gui-claude-web.md` (`## A.` đến `## F.`). Thiếu mục nào thì báo, không tự bịa phần thiếu.
3. **Đối chiếu trước khi ghi:** đề xuất nào trái `docs/spec/*`, `decisions.md`, phạm vi trong `CLAUDE.md`, hoặc bịa endpoint/field/mã lỗi thì liệt kê ra và hỏi; không nhập. Đổi spec chỉ được ghi thành việc của Huy Trường, không sửa `docs/spec/`.
4. Hiện danh sách thay đổi sẽ ghi (file nào, dòng nào, từ gì thành gì), chờ người dùng đồng ý từng nhóm:
   - `docs/handoff/OPEN_QUESTIONS.md`: câu đóng (chuyển sang "Đã trả lời", ghi "chốt trong họp dd/mm"), câu mới (đủ cột Cụm, Ảnh hưởng ai);
   - `docs/handoff/STATUS.md`: dòng từng người;
   - `docs/reports/tuan-NN/CHOT-TUAN-NN.md` theo `_MAU-chot.md` (bản tự đủ nghĩa để gửi nhóm và dùng làm bối cảnh cho Claude web tuần sau);
   - `docs/reports/tuan-NN/prompt-tuan-(N+1)/<ten>.md`: 5 prompt đã tối ưu;
   - `docs/plan/*-plan.md`: chỉ khi chủ file (Sơn với fe-plan, Triển với be-plan) đồng ý.
5. Xuất Word cho `CHOT-TUAN-NN.md` và `TONG-HOP.md`: `node tools/report-docx/md2docx.mjs <file.md>`. Thiếu thư viện thì `npm install` trong `tools/report-docx` (hỏi trước).
6. Soạn commit (chỉ khi người dùng đồng ý, không push): `docs(report): chốt tuần N, prompt tuần N+1`. Soạn tin nhắn nhóm chat ≤ 10 dòng: quyết định mới, ai phải làm gì, nhắc mỗi người `git pull` rồi lấy prompt của mình.
