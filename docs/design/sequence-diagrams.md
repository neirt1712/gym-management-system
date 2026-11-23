# Sơ đồ tuần tự các luồng khó

- **Ai sở hữu:** Triển (thanh toán, lịch PT), Hồng Anh (kích hoạt tài khoản). **Khi nào cập nhật:** khi luồng hoặc API đổi.
- Bảng từng bước của các luồng nằm ở mục 12 tài liệu Tiến hành công việc.

## Mua gói và thanh toán (UC09, UC12, UC13)

```mermaid
sequenceDiagram
    autonumber
    actor HV as Hội viên / Staff
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant VN as VNPay
    HV->>FE: Chọn gói và ngày bắt đầu
    FE->>BE: POST /orders/quote
    BE-->>FE: total, endsOn
    HV->>FE: Xác nhận mua
    FE->>BE: POST /orders
    alt Đã có đơn PENDING cùng gói
        BE-->>FE: 409 PENDING_ORDER_EXISTS kèm orderId
    else Tạo mới
        BE->>DB: INSERT orders PENDING (chụp điều khoản)
        BE-->>FE: 201 order
    end
    alt Trả qua VNPay
        FE->>BE: POST /orders/{id}/payments (VNPAY)
        BE->>DB: INSERT payments PENDING, merchant_ref
        BE-->>FE: checkoutUrl
        FE->>VN: Chuyển sang trang thanh toán
        VN->>BE: GET /payments/vnpay/ipn
        BE->>BE: Kiểm chữ ký và số tiền
        BE->>DB: UPDATE payments SUCCESS
        Note over BE,DB: IPN gửi lặp bị chặn bởi unique gateway_txn_id
        VN-->>FE: Quay về trang kết quả
    else Trả tiền mặt tại quầy
        FE->>BE: POST /orders/{id}/payments (CASH)
        Note over FE,BE: Staff nhận đủ tiền
        FE->>BE: POST /payments/{id}/confirm-cash
        BE->>DB: UPDATE payments SUCCESS, ghi audit_logs
    end
    Note over BE,DB: Một transaction kích hoạt gói
    BE->>DB: UPDATE orders PAID, sinh receipt_no
    BE->>DB: INSERT subscriptions ACTIVE
    BE->>DB: INSERT notifications PAYMENT_SUCCESS
    FE->>BE: GET /orders/{id} (polling)
    BE-->>FE: PAID kèm biên lai
```

## VNPay: tạo thanh toán, IPN và trang kết quả (UC12)

Chi tiết hơn nhánh "Trả qua VNPay" ở trên. Nguồn: `docs/api/openapi.yaml` (`POST /orders/{id}/payments`, `GET /payments/vnpay/ipn`, `GET /orders/{id}`).

```mermaid
sequenceDiagram
    autonumber
    actor HV as Hội viên
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant VN as VNPay sandbox
    HV->>FE: Chọn thanh toán VNPay cho đơn PENDING
    FE->>BE: POST /orders/{id}/payments (VNPAY)
    BE->>DB: Đơn còn PENDING?
    opt Đơn đã có payment PENDING (bấm thanh toán lại)
        BE->>DB: UPDATE payment cũ FAILED
    end
    BE->>DB: INSERT payments PENDING (merchant_ref mới), đơn hết hạn sau 30 phút
    BE->>BE: Ký URL bằng HMAC SHA512 (vnp_TxnRef = merchantRef, vnp_Amount = amount × 100)
    BE-->>FE: 201 payment kèm checkoutUrl
    FE->>VN: Chuyển trình duyệt sang checkoutUrl
    HV->>VN: Nhập thẻ thử, xác nhận
    par VNPay gọi BE (server với server)
        VN->>BE: GET /payments/vnpay/ipn?vnp_*
        alt Sai chữ ký
            BE-->>VN: RspCode 97
        else Không có payment theo vnp_TxnRef
            BE-->>VN: RspCode 01
        else vnp_Amount khác amount × 100
            BE-->>VN: RspCode 04
        else Payment đã xử lý (IPN gửi lặp)
            BE-->>VN: RspCode 02, không làm gì thêm
        else vnp_ResponseCode, vnp_TransactionStatus = 00
            Note over BE,DB: Một transaction (giống confirm-cash)
            BE->>DB: payment SUCCESS, gateway_txn_id, gateway_payload
            BE->>DB: đơn PAID, sinh receipt_no
            BE->>DB: INSERT subscriptions ACTIVE
            BE->>DB: INSERT notifications PAYMENT_SUCCESS
            BE-->>VN: RspCode 00
        else Thanh toán thất bại hoặc hủy
            BE->>DB: payment FAILED, gateway_payload (đơn vẫn PENDING, trả lại được)
            BE->>DB: INSERT notifications PAYMENT_FAILED
            BE-->>VN: RspCode 00
        end
    and VNPay đưa người dùng về
        VN-->>FE: Chuyển về trang kết quả (return URL kèm vnp_*)
        Note over FE: Không tin tham số trên return URL
        loop Mỗi 2–3 giây, tối đa khoảng 1 phút
            FE->>BE: GET /orders/{id}
            BE-->>FE: status (PENDING hoặc PAID)
        end
        alt PAID
            FE-->>HV: Thành công, hiện biên lai và gói
        else Vẫn PENDING sau 1 phút
            FE-->>HV: "Đang chờ xác nhận", nút tải lại hoặc thanh toán lại
        end
    end
```

- IPN có thể tới **trước hoặc sau** khi người dùng về trang kết quả; FE chỉ dựa vào `GET /orders/{id}`.
- Chống tạo gói hai lần: unique `gateway_txn_id` và "một payment SUCCESS mỗi đơn" (ERD v3). Phải có test IPN gửi lặp và gửi song song (`docs/team/roles/be-lead.md` mục 6).
- Response IPN luôn HTTP 200 theo định dạng VNPay `{ RspCode, Message }`, không theo dạng lỗi chung.
- Quá 30 phút không có IPN thành công: job 5 phút chuyển đơn `EXPIRED`, payment PENDING → FAILED (quyết định 9, 17).
- Chưa chốt (Q17d): IPN báo thành công cho payment đã FAILED vì bị thay bằng lần thanh toán mới.

## Thương lượng lịch PT (UC23–UC27)

```mermaid
sequenceDiagram
    autonumber
    actor HV as Hội viên
    participant BE as Backend
    actor PT as PT
    HV->>BE: POST /appointments (giờ đề xuất)
    BE->>BE: Kiểm gói PT ACTIVE, trong hạn, còn buổi
    BE-->>PT: Thông báo APPOINTMENT_REQUESTED
    loop Mỗi lần một bên muốn giờ khác
        PT->>BE: POST /appointments/{id}/proposals (COUNTER)
        BE-->>HV: Đề xuất mới, version + 1, chờ hội viên
    end
    alt Bên đang được hỏi đồng ý
        HV->>BE: POST /appointments/{id}/accept (expectedVersion)
        Note over BE: SELECT … FOR UPDATE dòng PT, kiểm trùng PT, hội viên, lớp
        BE-->>HV: CONFIRMED
        BE-->>PT: CONFIRMED
    else Bên đang được hỏi từ chối
        HV->>BE: POST /appointments/{id}/reject (lý do)
        BE-->>PT: REJECTED, nhả chỗ đã giữ
    end
    opt Đổi hoặc hủy lịch đã chốt
        HV->>BE: POST /appointments/{id}/proposals (RESCHEDULE hoặc CANCEL)
        PT->>BE: accept hoặc reject
        Note over BE: Lịch cũ giữ nguyên tới khi bên kia đồng ý
    end
    PT->>BE: POST /appointments/{id}/complete (COMPLETED hoặc NO_SHOW)
    BE-->>HV: Trừ 1 buổi, cập nhật số buổi còn lại
```

## Kích hoạt tài khoản tạo tại quầy (UC20, UC01, UC04)

```mermaid
sequenceDiagram
    autonumber
    actor ST as Staff
    actor K as Khách
    participant BE as Backend
    participant M as Email
    ST->>BE: POST /members (không mật khẩu)
    BE-->>ST: accountActivated = false
    K->>BE: POST /auth/register (cùng SĐT)
    BE-->>K: 409 ACTIVATION_REQUIRED
    K->>BE: POST /auth/forgot-password
    BE->>M: Gửi link đặt mật khẩu, hạn 30 phút
    K->>BE: POST /auth/reset-password (token, mật khẩu mới)
    BE-->>K: Đã kích hoạt, đăng nhập được
```
