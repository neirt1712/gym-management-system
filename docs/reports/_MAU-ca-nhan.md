# Báo cáo tuần {N} — {Họ tên} ({Vai trò})

| Mục | Nội dung |
| --- | --- |
| Tuần | {N} ({Thứ Hai dd/mm} – {Chủ Nhật dd/mm}/2026) |
| Người báo cáo | {Họ tên} · {Vai trò} · tên file `{ten}` |
| Ngày viết | {dd/mm/yyyy} |
| Tự đánh giá | {Đúng kế hoạch / Trễ ít / Trễ nhiều} — {x}/{y} việc kế hoạch đã xong |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần {N} trong `docs/plan/{fe|be}-plan.md` (và `docs/plan/preparation.md` nếu có hạng mục của mình).

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | {việc} | {dd/mm} | Xong / Đang làm / Chưa / Bỏ | {PR #.., commit, đường dẫn} | |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | {việc} | {ai nhờ, phát sinh gì} | |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | {việc} | {lý do thật, không đổ lỗi chung chung} | {dd/mm} | {người, màn, endpoint} |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | | | | |

## 5. Bàn giao

- **Đã gửi:** {cái gì, cho ai, file trong `docs/handoff/handoffs/`}
- **Đã nhận:** {cái gì, từ ai}

## 6. Câu hỏi mở liên quan

Từ `docs/handoff/OPEN_QUESTIONS.md`: {Qx — một dòng — hạn} . Câu hỏi mới phát sinh thì ghi vào file đó trước, ở đây chỉ nhắc mã.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- {đề xuất, lý do, cần ai duyệt; không có thì ghi "Không có"}

## 8. Kế hoạch tuần {N+1}

Từ dòng tuần {N+1} trong kế hoạch, cộng các việc dồn lại ở mục 3.

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | | | |

## 9. Ghi chú, bài học

- {tối đa 3 dòng: điều học được, điều nên làm khác, công cụ/skill hữu ích}
