# Trạng thái hiện tại

- **Ai cập nhật:** mỗi người tự sửa dòng của mình khi xong task (`/team-finish`) và trước buổi họp Thứ Hai.
- **Ai đọc:** cả nhóm và Claude, ở đầu mỗi phiên (`/team-start`).
- Giữ ngắn: tối đa 3 gạch đầu dòng mỗi cột. Lịch sử xem git log, không chép vào đây.

Cập nhật lần cuối: 10/11/2026 (mục bên dưới bảng, dòng Triển); 08/11 (dòng Hồng Anh); 25/10 (dòng Sơn)

**Ghi chú 10/11 (Triển, ngày 1 kế hoạch 2 tuần hoàn thành web):** nhánh `tsonw4-tich-hop` (PR #26) chạy e2e trên Postgres 16 local: **177/177 test xanh** (10 bộ), lint, typecheck, 42 unit test, build đạt; CI GitHub xanh. Đã thêm 24 test users của Hồng Anh và sửa users cho khớp openapi (commit `c9524f3`). Nhánh `trienw6-gop-ci-status` gộp sẵn #28 (CI) và #33 (tài liệu), mở PR sau khi #26 vào `develop`. #30, #32 trùng nội dung #26, đóng được; #29 đã lấy test, đóng được; #34 trỏ nhầm `main`, đóng.

| Người | Đã xong (tuần này) | Đang làm | Đang vướng / chờ ai |
| --- | --- | --- | --- |
| Triển | Demo giữa kỳ VNPay sandbox + tiền mặt (09/11); e2e nhánh tích hợp 177/177 xanh; users khớp openapi (mở khóa không tăng `token_version`, sang MEMBER trả 422, hồ sơ PT INACTIVE khi đổi vai trò) | Ngày 2–4 (11–13/11): Lớp học 7 API; sau đó bảo lưu, theo dõi tập, báo cáo | Review + merge PR #26 (Hồng Anh hoặc Sơn Approve); Q25 (Hồng Anh, Huy Trường); 4 chỗ kế hoạch 2 tuần lệch openapi (điểm danh lớp, báo cáo, 4 API chưa ai nhận, job tuần 7) |
| Hồng Anh | GitHub Actions `ci.yml` BE + FE, không deploy (`honganhw5-ci`); tài khoản UC31–UC35 có audit (`honganhw5-users`, 24 e2e); thông báo UC42 (`honganhw5-notifications`, 7 e2e); PT UC21–UC23, UC28, UC33 (`honganhw5-trainers`, 18 e2e); check-in, check-out, lịch sử UC16–UC18 + job 23:59 (`honganhw5-check-ins`, 15 e2e) | Chờ PR 5 nhánh trên. Tiếp: seed demo; tuần 6: training-notes, training-plans, freeze/unfreeze | Seed demo chờ orders/payments (Sơn, `tsonw4-tich-hop` chưa có trên GitHub), appointments (Triển); check-in làm theo Q17(b) Hồng Anh báo đã chốt, cần ghi vào `OPEN_QUESTIONS.md`; Q24 chờ duyệt |
| Sơn | Tuần 2 (nhánh `tsonw2-auth-screens`): đăng ký, khóa tạm khi đăng nhập, hồ sơ, ảnh đại diện, đổi mật khẩu; 3 mã lỗi Q16/Q21. Tuần 3 (`tsonw3-purchase`): `PurchaseFlow`, mua gói, đơn và kết quả thanh toán (chờ VNPay 3 giây/60 giây), biên lai in, lịch sử đơn và giao dịch, Gói của tôi, mã QR + tạo lại; 43 test; bàn giao `handoffs/purchase-flow-tson-to-tbang.md` | Chờ push và PR 2 nhánh; tuần 4: lịch PT hội viên | API thật: Auth + `/me` (Triển, trễ từ 14/10), Đơn, Thanh toán (Triển); danh mục gói `/packages` và component dùng chung (Bằng, chưa có commit) |
| Bằng | | Figma màn demo, token, component | |
| Huy Trường | | Tài liệu 2 v3, tiêu chí chấp nhận, bảng công việc | |
