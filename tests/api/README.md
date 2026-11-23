# Test API bằng Postman / Newman

- **Ai viết:** Triển (request mẫu khi endpoint xong, file vai trò BE Lead mục 4). **Ai dùng:** Huy Trường (test), cả nhóm.
- Hợp đồng: `docs/api/openapi.yaml`. Mỗi request có test kiểm mã HTTP và `error.code`.

| File | Nội dung |
| --- | --- |
| `gym-be.postman_collection.json` | Xác thực, hồ sơ, mua gói tiền mặt, gói hội viên, VNPay với IPN tự ký, đăng xuất (UC01–UC03, UC05–UC07, UC09, UC10, UC12–UC15) |

## Chạy

1. Trong `backend/`: `npm run seed` rồi `npm run start:dev` (cổng 3000).
2. Postman: Import file collection → tab **Variables** của collection, điền `seedPassword` (= `SEED_DEFAULT_PASSWORD` trong `backend/.env`) và `vnpHashSecret` (= `VNPAY_HASH_SECRET`). **Không** lưu giá trị thật vào file rồi commit.
3. Bấm **Run collection**, chạy theo thứ tự từ trên xuống (các request sau dùng biến do request trước lưu).

Chạy bằng dòng lệnh (không cần cài Postman):

```
npx newman run tests/api/gym-be.postman_collection.json --env-var seedPassword=<mật khẩu seed> --env-var vnpHashSecret=<khóa VNPay>
```

Chạy lại nhiều lần được: hội viên seed đã có đơn chờ thì bước tạo đơn nhận `409 PENDING_ORDER_EXISTS` và lấy lại `orderId` cũ; phần VNPay dùng tài khoản đăng ký mới mỗi lần.
