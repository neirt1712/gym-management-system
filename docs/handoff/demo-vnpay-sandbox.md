# Demo thanh toán VNPay sandbox trên máy local

Q23: nhóm chỉ chạy local. VNPay chỉ gọi IPN tới URL công khai, nên muốn IPN thật về máy thì mở ngrok. Không mở được ngrok thì dùng script giả lập IPN ở bước 5b.

Các chỗ ghi **(kiểm lại)** là theo trí nhớ, chưa đối chiếu với tài liệu VNPay; dùng đúng thông tin trong email VNPay gửi.

## 1. Đăng ký sandbox

1. Đăng ký tài khoản merchant test tại `https://sandbox.vnpayment.vn/devreg` **(kiểm lại)**.
2. Email trả về có `vnp_TmnCode`, `vnp_HashSecret`, link trang quản trị merchant và thẻ test.
3. Không gửi hai mã này vào nhóm chat hay cho Claude. Chỉ điền vào `backend/.env`.

## 2. Database

Cần một Postgres có database `gym` (hoặc Supabase). Trong `backend/`:

```powershell
npx prisma migrate deploy
npm run seed
```

`npm run seed` cần biến `SEED_DEFAULT_PASSWORD` trong `.env`: mật khẩu chung cho tài khoản mẫu. Hội viên mẫu có SĐT `0910000001` trở đi, Staff `0900000011`.

## 3. Biến môi trường (tên biến, tự điền giá trị)

`backend/.env`:

| Biến | Giá trị |
| --- | --- |
| `DATABASE_URL` | chuỗi kết nối tới DB `gym` |
| `JWT_SECRET` | chuỗi ngẫu nhiên bất kỳ |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | từ email VNPay |
| `VNPAY_URL` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` **(kiểm lại)** |
| `VNPAY_RETURN_URL` | `http://localhost:5173/member/orders` (BE tự gắn thêm `/<mã đơn>`) |

`frontend/.env`: `VITE_AUTH_MODE=http` (gọi backend thật, không dùng mock).

## 4. Chạy

Mở hai terminal:

```powershell
cd backend; npm run start:dev
```

```powershell
cd frontend; npm run dev
```

## 5. Nhận IPN

**5a. IPN thật qua ngrok (nên dùng khi demo):**

```powershell
D:\ngrok-v3-stable-windows-amd64\ngrok.exe http 3000
```

Lấy địa chỉ `https://...ngrok-free.app` ngrok in ra, khai IPN URL `https://...ngrok-free.app/api/v1/payments/vnpay/ipn` trong trang quản trị merchant sandbox **(kiểm lại vị trí mục cấu hình IPN)**. Lần đầu dùng ngrok phải đăng ký tài khoản miễn phí và chạy `ngrok config add-authtoken <token>`. Mỗi lần mở lại ngrok bản miễn phí, địa chỉ có thể đổi; khi đó khai lại IPN URL.

**5b. Không có ngrok (chỉ khi luyện, không dùng lúc báo cáo):** sau khi trả tiền trên trang VNPay, chạy

```powershell
cd backend
node --env-file=.env -r ts-node/register scripts/simulate-vnpay-ipn.ts <merchantRef>
```

`merchantRef` lấy ở `GET /api/v1/payments`. Thêm `fail` ở cuối để giả lập khách hủy.

## 6. Kịch bản demo

1. Đăng nhập hội viên mẫu, chọn gói, chọn ngày bắt đầu, xem báo giá, tạo đơn.
2. Chọn **VNPay**, trình duyệt chuyển sang trang sandbox.
3. Trả bằng thẻ test trong email. Thẻ NCB thường dùng: số `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456` **(kiểm lại)**.
4. VNPay đưa về `/member/orders/<mã đơn>`. Trang hỏi lại `GET /orders/{id}` mỗi 3 giây, tối đa 60 giây, và đổi sang **đã thanh toán** khi IPN tới. Trang không tự đánh dấu đã trả từ tham số trên URL.
5. Mở **Gói của tôi**: gói mới ở trạng thái ACTIVE; chuông có thông báo "Thanh toán thành công" (khi màn thông báo xong).
6. Ca phụ để demo: khách hủy trên trang VNPay → đơn vẫn chờ thanh toán, trả lại được.

## Khi lỗi

- Bấm VNPay báo lỗi máy chủ: thiếu một trong bốn biến `VNPAY_*` trong `backend/.env`.
- Trang VNPay báo sai chữ ký: kiểm lại `VNPAY_HASH_SECRET`, không có khoảng trắng thừa.
- Trả xong mà trang đơn không đổi sau 60 giây: IPN chưa tới. Kiểm ngrok đang chạy và IPN URL đã khai, hoặc dùng bước 5b.
