---
name: team-report
description: Viết báo cáo công việc cá nhân cuối tuần trong dự án gym (Markdown + Word) theo mẫu chung của nhóm, tự điền nháp từ git, STATUS, kế hoạch tuần và OPEN_QUESTIONS. Dùng khi người dùng gõ /team-report hoặc nói viết báo cáo tuần, báo cáo cá nhân.
argument-hint: "[số tuần, bỏ trống = tuần hiện tại]"
---

# Báo cáo tuần cá nhân

Đầu vào: $ARGUMENTS (số tuần; bỏ trống thì tính từ ngày hôm nay, tuần 1 bắt đầu Thứ Hai 05/10/2026).
Hướng dẫn chung và bảng tên viết tắt: `docs/reports/README.md`. Mẫu: `docs/reports/_MAU-ca-nhan.md`.

1. **Xác định người và tuần:**
   - người dùng là ai, vai trò gì: `CLAUDE.local.md`; tên file lấy từ bảng tên viết tắt trong `docs/reports/README.md`;
   - tuần N, ngày Thứ Hai và Chủ Nhật của tuần (`date`);
   - file ra: `docs/reports/tuan-NN/<ten>.md` (NN hai chữ số). Đã có thì đọc và cập nhật, không ghi đè mất nội dung người dùng đã viết.
2. **Thu thập dữ liệu thật** (chỉ đọc):
   - kế hoạch: dòng tuần N và N+1 của người đó trong `docs/plan/fe-plan.md` hoặc `docs/plan/be-plan.md`; hạng mục của người đó trong `docs/plan/preparation.md`;
   - việc đã làm: `git fetch` rồi `git log origin/develop --since=<Thứ Hai> --until=<Chủ Nhật 23:59>`; lấy commit có tác giả là người dùng (hỏi tên tác giả git nếu không chắc) và merge commit của nhánh bắt đầu bằng `<ten>w`;
   - trạng thái: dòng của người đó trong `docs/handoff/STATUS.md`, câu hỏi liên quan trong `docs/handoff/OPEN_QUESTIONS.md`, bàn giao trong `docs/handoff/handoffs/`, cột của mình trong `docs/handoff/CONTRACT_STATUS.md`.
3. **Điền nháp** theo mẫu `_MAU-ca-nhan.md`, đủ 9 mục:
   - mỗi việc trong kế hoạch một dòng ở mục 1, trạng thái dựa trên bằng chứng (PR, commit, file). Không có bằng chứng thì để "Chưa rõ" và hỏi, **không tự ghi Xong**;
   - mục 3 (trễ) và mục 7 (đề xuất): chỉ ghi điều có trong dữ liệu hoặc người dùng nói; chỗ trống thì để `{cần bạn điền}`;
   - mục 8 lấy từ dòng tuần N+1 cộng việc dồn ở mục 3.
4. **Hỏi người dùng** tối đa 5 câu để lấp chỗ trống (lý do trễ, việc ngoài kế hoạch, vướng mắc, bài học). Người dùng sửa xong mới sang bước 5.
5. **Xuất Word:** chạy `node tools/report-docx/md2docx.mjs docs/reports/tuan-NN/<ten>.md`. Lỗi thiếu thư viện thì chạy `npm install` trong thư mục `tools/report-docx` (hỏi trước) rồi chạy lại. Báo đường dẫn file `.docx`.
6. **Không sửa** kế hoạch, STATUS hay OPEN_QUESTIONS trong skill này; đề xuất thì ghi ở mục 7. Câu hỏi mới thật sự chặn việc thì nhắc người dùng thêm vào `OPEN_QUESTIONS.md`.
7. **Soạn commit** (chỉ commit khi người dùng đồng ý, không push): nhánh `<ten>w<N>-report`, message `docs(report): tuần N báo cáo của <ten>`, gồm file `.md` và `.docx`. Nhắc người dùng mở PR vào `develop` và báo Huy Trường.
