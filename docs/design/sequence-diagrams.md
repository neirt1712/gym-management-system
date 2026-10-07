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
