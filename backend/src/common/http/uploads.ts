import { join } from 'path';

/** Thư mục lưu file tải lên trên máy chạy BE (Q23: chỉ chạy local). Không commit (backend/.gitignore). */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

/** Đường dẫn công khai phục vụ file tải lên, nằm dưới tiền tố API để Vite proxy chuyển được. */
export const UPLOAD_ROUTE = '/api/v1/uploads';
