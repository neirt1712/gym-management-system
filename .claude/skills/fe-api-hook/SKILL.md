---
name: fe-api-hook
description: Tạo hook TanStack Query (query hoặc mutation) cho một endpoint của API gym, dùng kiểu sinh từ openapi.yaml. Dùng khi cần gọi một API mới từ frontend hoặc khi người dùng nhắc tới hook, query, mutation cho endpoint nào đó.
argument-hint: "[METHOD /path]"
---

# Tạo hook gọi API

Đầu vào: $ARGUMENTS (ví dụ `POST /appointments/{id}/accept`).

1. Tìm endpoint trong `frontend/src/api/schema.d.ts`. Không có thì chạy `npm run gen:api`; vẫn không có thì dừng, báo cần Triển bổ sung openapi.yaml.
2. Đặt hook vào `src/features/<domain>/api.ts` của domain tương ứng; domain chưa có thì tạo file mới theo mẫu của domain gần nhất.
3. Quy ước:
   - **GET danh sách:** `useXxxList(params)`; query key `queryKeys.xxx.list(params)`; giữ `meta` cho phân trang.
   - **GET chi tiết:** `useXxx(id)`; `enabled: !!id`.
   - **POST/PATCH/DELETE:** `useXxxAction()` trả `useMutation`. Thành công thì invalidate key danh sách và chi tiết liên quan.
   - Action lịch PT luôn gửi `expectedVersion`. Gặp `STALE_VERSION` thì invalidate chi tiết lịch để tải lại.
   - Kiểu request/response lấy từ `paths['/x']['post']`; không viết interface tay.
   - Không gọi `message.success` trong hook; để component quyết định chữ hiển thị.
4. Thêm key mới vào `src/api/queryKeys.ts` (file của Sơn). Nếu người dùng không phải Sơn thì ghi đoạn cần thêm vào báo cáo.
5. Viết test Vitest ngắn với MSW cho trường hợp thành công và một mã lỗi chính.
6. Chạy `npm run typecheck`.
