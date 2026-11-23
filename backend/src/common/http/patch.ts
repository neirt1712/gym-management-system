/**
 * Body PATCH không có field nào được gửi. Không dùng `Object.keys(dto).length`: ValidationPipe (transform)
 * tạo instance của class DTO, mọi field khai báo đều có mặt với giá trị `undefined` nên số khóa không bao giờ bằng 0.
 * `null` vẫn tính là đã gửi (dùng để xóa giá trị).
 */
export const isEmptyPatch = (dto: object): boolean => Object.values(dto).every((v) => v === undefined);
