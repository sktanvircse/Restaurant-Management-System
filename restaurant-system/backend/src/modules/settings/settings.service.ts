import { prisma } from '../../config/prisma';

export class SettingsService {
  async getSettings(branchId?: number | null) {
    return prisma.setting.findMany({
      where: {
        OR: [{ branchId: null }, ...(branchId ? [{ branchId }] : [])],
      },
    });
  }

  async updateSetting(key: string, value: string, branchId?: number | null, userId?: number) {
    const existing = await prisma.setting.findFirst({
      where: { key, branchId: branchId || null },
    });

    if (existing) {
      return prisma.setting.update({
        where: { id: existing.id },
        data: { value, updatedBy: userId },
      });
    }

    return prisma.setting.create({
      data: {
        key,
        value,
        branchId: branchId || null,
        updatedBy: userId,
      },
    });
  }
}

export const settingsService = new SettingsService();
