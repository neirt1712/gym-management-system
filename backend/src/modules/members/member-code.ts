import type { Prisma } from '@prisma/client';

/**
 * Sinh mã hội viên HVxxxxxx tiếp theo. Dùng chung cho tạo tại quầy (UC20) và tự đăng ký (UC01).
 * Khóa theo giao dịch để hai yêu cầu cùng lúc không sinh trùng mã.
 */
export const nextMemberCode = async (tx: Prisma.TransactionClient): Promise<string> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('members.member_code'))`;
  const [{ max }] = await tx.$queryRaw<{ max: string | null }[]>`
    SELECT max(member_code) AS max FROM members WHERE member_code ~ '^HV[0-9]{6}$'`;
  const next = max ? Number(max.slice(2)) + 1 : 1;
  return `HV${String(next).padStart(6, '0')}`;
};
