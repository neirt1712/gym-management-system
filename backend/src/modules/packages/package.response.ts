import type { DurationUnit, Package, PackageStatus, PackageType } from '@prisma/client';

/** Schema `Package` trong openapi. */
export type PackageResponse = {
  id: string;
  name: string;
  description: string | null;
  type: PackageType;
  price: number;
  durationValue: number;
  durationUnit: DurationUnit;
  totalSessions: number | null;
  sessionMinutes: number | null;
  includesClass: boolean;
  benefits: string[];
  status: PackageStatus;
};

export const toPackageResponse = (pkg: Package): PackageResponse => ({
  id: pkg.id,
  name: pkg.name,
  description: pkg.description,
  type: pkg.type,
  price: pkg.price,
  durationValue: pkg.durationValue,
  durationUnit: pkg.durationUnit,
  totalSessions: pkg.totalSessions,
  sessionMinutes: pkg.sessionMinutes,
  includesClass: pkg.includesClass,
  benefits: pkg.benefits,
  status: pkg.status,
});
