# Vai trò: PM — Huy Trường

Chủ vai trò duyệt file này. Sửa qua PR.

## 1. Phạm vi sở hữu
- GitHub Projects, `docs/spec/` (cập nhật sau khi họp chấp thuận), `docs/process/dor-dod.md`, `docs/plan/preparation.md`, `docs/handoff/OPEN_QUESTIONS.md` (đóng câu hỏi).
- `tests/api/` (Postman/Newman), `tests/e2e/` (Playwright, ghép đủ 5 luồng), `tests/load/` (k6), `tests/TEST_PLAN.md`, test case `TC-UCxx-nn`.
- Biên bản tuần, báo cáo môn học, slide, kịch bản demo.

## 2. Không được sửa
- Code ứng dụng trong `backend/src`, `frontend/src`; `docs/api/openapi.yaml`.

## 3. Đầu vào phải đọc
- `docs/handoff/STATUS.md`, `CONTRACT_STATUS.md` (endpoint nào đã Real để test).
- PR đã merge vào `develop`.

## 4. Đầu ra phải bàn giao
| Cho ai | Cái gì | Hạn |
| --- | --- | --- |
| Cả nhóm | Tài liệu 2 v3 + tiêu chí chấp nhận nhóm demo | 08/10 |
| Cả nhóm | Thuật ngữ, ma trận phân quyền | 09/10 |
| Người làm | Kết quả test trong vòng 1 ngày sau khi được báo xong; bug trên GitHub Issues theo mẫu | liên tục |

## 5. Checklist trước PR
Test chạy được trên staging; tên test theo `TC-UCxx-nn`; không đổi code ứng dụng.

## 6. Quy ước kỹ thuật riêng
- Postman: mỗi nhóm API là một thư mục; request mở đầu đăng nhập 4 vai trò; môi trường local và staging.
- Báo cáo Newman HTML lưu vào `tests/reports/` (không commit file lớn).

## 7. Lệnh và skill thường dùng
- Lệnh: `npx newman run tests/api/gym.postman_collection.json -e tests/api/staging.postman_environment.json -r cli,htmlextra`, `npx playwright test`.
- Skill: `/team-start`, `/team-finish`. Skill riêng sau này đặt tiền tố `pm-`.

## 8. Khi bị kẹt thì hỏi ai
BE: Triển · FE: Sơn · dữ liệu, staging: Hồng Anh.
