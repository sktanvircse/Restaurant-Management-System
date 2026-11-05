import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';

export class CouponsService {
  async getCoupons(branchId?: number) {
    return prisma.coupon.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(data: any) {
    const code = data.code.toUpperCase().trim();

    const existing = await prisma.coupon.findFirst({
      where: { branchId: data.branchId, code, deletedAt: null },
    });
    if (existing) throw new ConflictError('Coupon code already exists in this branch');

    return prisma.coupon.create({
      data: {
        branchId: data.branchId,
        code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount ?? 0,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCoupon(id: number, data: any) {
    const coupon = await prisma.coupon.findFirst({ where: { id, deletedAt: null } });
    if (!coupon) throw new NotFoundError('Coupon not found');

    const updateData = { ...data };
    if (data.code) updateData.code = data.code.toUpperCase().trim();
    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);

    return prisma.coupon.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCoupon(id: number) {
    const coupon = await prisma.coupon.findFirst({ where: { id, deletedAt: null } });
    if (!coupon) throw new NotFoundError('Coupon not found');

    await prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async validateCoupon(branchId: number, code: string, orderAmount: number) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        branchId,
        code: code.toUpperCase().trim(),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!coupon) throw new NotFoundError('Invalid coupon code');

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestError('Coupon code has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon code usage limit has been reached');
    }

    if (orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestError(`Minimum order amount of ${coupon.minOrderAmount} required for this coupon`);
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (orderAmount * Number(coupon.value)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else if (coupon.type === 'FLAT') {
      discount = Math.min(orderAmount, Number(coupon.value));
    }

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discountAmount: Math.round(discount * 100) / 100,
    };
  }

  // ==========================================
  // LOYALTY POINTS
  // ==========================================

  async getLoyaltyHistory(customerId: number) {
    const [customer, history] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, loyaltyPoints: true },
      }),
      prisma.loyaltyTransaction.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!customer) throw new NotFoundError('Customer not found');

    return {
      currentPoints: customer.loyaltyPoints,
      history,
    };
  }
}

export const couponsService = new CouponsService();
