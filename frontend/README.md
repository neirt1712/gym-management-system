# Frontend — bản đồ thư mục

Đọc file này trước khi mở code. Quy ước chi tiết: `CLAUDE.md` (cùng thư mục). Hướng dẫn cho người mới làm giao diện: `../docs/design/fe-huong-dan-component.md`.

## Chạy thử

```powershell
cd frontend
npm install                      # lần đầu; đồng thời bật husky cho cả repo
Copy-Item .env.example .env.local
npm run dev                      # mở http://localhost:5173/login
```

Đăng nhập bằng số điện thoại. Tài khoản mẫu (chế độ `VITE_AUTH_MODE=fake`, mặc định), mật khẩu `matkhau123` (khớp ví dụ trong openapi): Quản trị `0900000001`, Quầy `0900000002`, PT `0900000003`, Hội viên `0901234567`, bị khóa `0900000009`.

Chạy với mock API (Prism, từ `docs/api/openapi.yaml`): `npm run dev:mock`. Chi tiết: `docs/design/fe-architecture.md`, mục "Chạy với mock và với backend".

## Cây thư mục

Code xếp **theo tính năng**: mọi thứ của một nghiệp vụ nằm chung một chỗ, mỗi thư mục có một chủ. Cột cuối cho biết thư mục tương ứng trong các sơ đồ "cấu trúc React" phổ biến trên mạng.

```
frontend/
├── node_modules/       thư viện đã cài (tự sinh, không commit)            [node_modules/]
├── index.html          trang HTML gốc, React vẽ vào <div id="root">      [public/index.html]
├── package.json        danh sách thư viện và lệnh (dev, lint, test, build)
└── src/                code chính                                         [src/]
    ├── main.tsx        điểm bắt đầu: gắn App vào trang
    ├── app/            khung app: đường dẫn, menu theo vai trò, bảo vệ route, trang 403/404
    ├── api/            kết nối backend (client.ts, queryKeys.ts, kiểu sinh tự động)   [api/]
    ├── components/     mảnh giao diện dùng lại: PageHeader, DataTable, ...           [components/]
    ├── features/       mỗi nghiệp vụ một thư mục: hook gọi API, component riêng, context
    │   └── auth/       đăng nhập, phiên đăng nhập                                     [hooks/ services/ context/]
    ├── pages/          màn hình, chia theo vai trò                                    [pages/]
    │   ├── public/     trang chủ, gói tập, đăng nhập, đăng ký
    │   ├── member/     cổng hội viên
    │   ├── trainer/    màn của PT
    │   ├── staff/      màn quầy
    │   └── admin/      màn quản trị
    ├── theme/          bộ màu, khoảng cách, nhãn và màu trạng thái                    [data/ assets/]
    ├── lib/            hàm tiện ích: định dạng tiền/ngày, dịch mã lỗi                 [utils/]
    └── test/           công cụ dùng cho test
```

Không dùng Redux: dữ liệu từ API do TanStack Query giữ, phiên đăng nhập do `AuthProvider` giữ (ADR 0001).
Thư mục chưa có (`api/`, `components/`, `pages/member/`…) sẽ được tạo khi tới việc; xem `docs/plan/fe-plan.md`.

## Ai sở hữu thư mục nào

| Thư mục                 | Sơn (FE Lead)                                                        | Bằng (FE Sub)                                                                                                              |
| ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `app/`, `api/`          | ✔                                                                    | đưa patch cho Sơn                                                                                                          |
| `components/`, `theme/` | đưa patch cho Bằng                                                   | ✔ (đổi `theme/` cần cả hai đồng ý)                                                                                         |
| `features/`             | auth, profile, purchase, subscriptions, appointments, classes-member | packages-admin, users-admin, staff-counter, check-in, trainer-members, availability, classes-admin, notifications, reports |
| `pages/`                | public (trừ gói tập), member, `trainer/Schedule*`                    | public gói tập, staff, admin, các trang PT còn lại                                                                         |
| `lib/`, `test/`         | dùng chung, sửa thì báo người kia                                    | dùng chung                                                                                                                 |

## Một màn đi qua những file nào (ví dụ đăng nhập)

1. `app/router.tsx` thấy đường dẫn `/login` → hiện `pages/public/LoginPage.tsx` trong `app/layouts/PublicLayout.tsx`.
2. Bấm Đăng nhập → `features/auth/AuthProvider.tsx` gọi `fakeAuthApi` khi `VITE_AUTH_MODE=fake` (mặc định), hoặc `httpAuthApi` qua `api/client.ts` khi `VITE_AUTH_MODE=http`.
3. Đăng nhập xong → `app/roles.ts` (`ROLE_HOME`) cho biết trang đầu của vai trò → `app/guards/` kiểm tra quyền → `app/layouts/AppLayout.tsx` vẽ menu từ `app/navigation.tsx`.
