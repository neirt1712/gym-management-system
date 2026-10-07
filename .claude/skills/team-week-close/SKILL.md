---
name: team-week-close
description: Tổng hợp 5 báo cáo tuần của nhóm gym, chốt tiến độ tuần, đề xuất cập nhật STATUS/kế hoạch/OPEN_QUESTIONS và soạn 5 prompt cho tuần sau (Markdown + Word). Huy Trường (PM) chạy sáng Thứ Hai, Sơn chạy thay khi cần. Dùng khi người dùng gõ /team-week-close hoặc nói tổng hợp, chốt tuần.
argument-hint: "[số tuần cần chốt, bỏ trống = tuần vừa qua]"
---

# Tổng hợp và chốt tuần

Đầu vào: $ARGUMENTS (số tuần N; bỏ trống thì là tuần vừa kết thúc, tính từ ngày hôm nay, tuần 1 bắt đầu 05/10/2026).
Hướng dẫn: `docs/reports/README.md`. Mẫu: `docs/reports/_MAU-tong-hop.md`, `docs/reports/_MAU-prompt.md`.

1. **Kiểm tra đầu vào:** `git fetch` rồi `git switch develop && git pull` (hỏi trước nếu đang có thay đổi chưa commit). Đọc 5 file `docs/reports/tuan-NN/<ten>.md` theo bảng tên trong `README.md`. Thiếu người nào thì báo tên, hỏi: chờ, hay tổng hợp với phần đang có (ghi rõ "thiếu báo cáo" ở mục 2).
2. **Đối chiếu với dữ liệu thật:** `docs/plan/fe-plan.md`, `docs/plan/be-plan.md` (dòng tuần N, N+1), `docs/plan/preparation.md`, `docs/handoff/STATUS.md`, `OPEN_QUESTIONS.md`, `CONTRACT_STATUS.md`, `git log origin/develop` trong tuần. Báo cáo ghi "Xong" mà không có bằng chứng thì đánh dấu "cần xác nhận"; không tự sửa báo cáo của người khác.
3. **Viết `docs/reports/tuan-NN/TONG-HOP.md`** theo mẫu, đủ 9 mục:
   - tiến độ theo người và cả nhóm (đếm việc kế hoạch xong / tổng, không ước lượng cảm tính);
   - bàn giao chính theo cột "Bàn giao" / "Phụ thuộc" của kế hoạch;
   - phụ thuộc đang chặn và rủi ro: ghép mục 3, 4 của các báo cáo; ai chờ ai;
   - mục 7 "Cần quyết trong họp": tối đa 3 phương án mỗi câu, có khuyến nghị; **không tự quyết thay nhóm**;
   - mục 8: chỉ **đề xuất** sửa STATUS, kế hoạch, OPEN_QUESTIONS; không sửa các file đó trong bước này.
4. **Soạn 5 prompt tuần N+1** vào `docs/reports/tuan-NN/prompt-tuan-(N+1)/<ten>.md` theo `_MAU-prompt.md`, mỗi người một bản:
   - việc lấy từ dòng tuần N+1 của người đó trong kế hoạch, cộng việc dồn lại, cộng quyết định mới;
   - phụ thuộc cụ thể (endpoint nào phải Real, component nào ai giao, hạn);
   - tên nhánh `<ten>w<N+1>-<mo-ta>`; giữ 3 điểm dừng của mẫu;
   - không thêm việc ngoài kế hoạch hay ngoài phạm vi (xem `CLAUDE.md`).
5. **Xuất Word** cho `TONG-HOP.md` (và prompt nếu người dùng muốn): `node tools/report-docx/md2docx.mjs <file.md>`. Thiếu thư viện thì chạy `npm install` trong thư mục `tools/report-docx` (hỏi trước).
6. **Sau họp** (người dùng báo đã duyệt): áp dụng các đề xuất ở mục 8 vào `STATUS.md`, `OPEN_QUESTIONS.md`; sửa `docs/plan/*-plan.md` chỉ khi chủ file (Sơn, Triển) đồng ý; sửa lại prompt nếu họp đổi việc.
7. **Soạn commit** (chỉ commit khi người dùng đồng ý, không push): nhánh `<ten>w<N>-week-close`, message `docs(report): tổng hợp tuần N và prompt tuần N+1`. Soạn tin nhắn ngắn cho nhóm chat: link TONG-HOP, nhắc mỗi người lấy prompt của mình.
