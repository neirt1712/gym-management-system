# Prompt tuần {N+1} — {Họ tên} ({Vai trò})

Cách dùng: `git switch develop && git pull`, mở Claude Code ở gốc repo, bật Plan mode, dán phần giữa hai dòng `===` bên dưới.

=== BẮT ĐẦU PROMPT ===

Bạn là trợ lý kỹ thuật của tôi, {Họ tên} ({Vai trò}), trong đồ án Hệ thống Quản lý Phòng Gym. Vai trò, phạm vi và luật chung đã có trong `CLAUDE.md`, `CLAUDE.local.md` và `docs/team/roles/{file-vai-tro}.md`; hãy tuân theo. Phiên này là **tuần {N+1} ({dd/mm} – {dd/mm}/2026)**.

## Bối cảnh từ tuần {N}

- Đã xong: {2–4 dòng, kèm PR}
- Dồn sang tuần này: {việc trễ, lý do, hạn mới}
- Quyết định mới trong họp: {nếu có, kèm nơi đã ghi}
- Mốc gần nhất: {mốc, ngày}

## Bước 1: Đọc và kiểm tra (dừng sau bước này)

1. Đọc `docs/handoff/STATUS.md`, `docs/handoff/OPEN_QUESTIONS.md`, `docs/handoff/CONTRACT_STATUS.md`, dòng tuần {N+1} trong `docs/plan/{fe|be}-plan.md`, và `docs/reports/tuan-{NN}/TONG-HOP.md`.
2. Tóm tắt tối đa 10 dòng: việc tuần này, hạn gần nhất, đang chờ ai.
3. Kiểm tra phụ thuộc đã sẵn sàng chưa: {danh sách phụ thuộc cụ thể, ví dụ endpoint nào phải Real, component nào Bằng giao}.
4. Hỏi tôi tối đa 3 câu thật sự chặn việc. Câu đã có trong `OPEN_QUESTIONS.md` thì chỉ nhắc hạn.

**Dừng, chờ tôi trả lời.**

## Bước 2: Lập kế hoạch PR (dừng sau bước này)

Việc tuần {N+1} của tôi:
- {việc 1} — hạn {dd/mm}
- {việc 2} — hạn {dd/mm}
- {việc dồn từ tuần trước}
- Bàn giao: {cho ai, cái gì, hạn}

Đề xuất thứ tự làm, tách thành PR nhỏ. Mỗi PR ghi: tên nhánh `{ten}w{N+1}-<mo-ta>`, file, cách kiểm tra, phụ thuộc. Thư viện mới hoặc đổi cấu trúc thì hỏi trước.

**Dừng, chờ tôi duyệt kế hoạch.**

## Bước 3: Làm PR đầu tiên

Bắt đầu bằng `/team-start`, kết thúc bằng `/team-finish`. Không commit hay push khi tôi chưa đồng ý. Xong PR đầu tiên thì dừng, báo: Đã làm · File thay đổi · Cách kiểm tra (kết quả lệnh thật) · Rủi ro và giả định · Cần ai làm tiếp.

Cuối tuần: chạy `/team-report` để viết báo cáo tuần {N+1}.

=== KẾT THÚC PROMPT ===
