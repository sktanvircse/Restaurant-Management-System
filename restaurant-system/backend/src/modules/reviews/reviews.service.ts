import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';
import { formatPaginatedResult } from '../../utils/pagination';

export class ReviewsService {
  async createReview(
    customerId: number,
    data: {
      orderId: number;
      foodRating: number;
      serviceRating?: number | null;
      overallRating: number;
      comment?: string | null;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { review: true },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.customerId && order.customerId !== customerId) {
      throw new BadRequestError('You can only review your own orders');
    }
    if (order.review) {
      throw new BadRequestError('This order has already been reviewed');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Review
      const review = await tx.review.create({
        data: {
          orderId: data.orderId,
          customerId,
          branchId: order.branchId,
          foodRating: data.foodRating,
          serviceRating: data.serviceRating || null,
          overallRating: data.overallRating,
          comment: data.comment || null,
          isVisible: true,
        },
        include: {
          customer: { select: { id: true, name: true, avatar: true } },
        },
      });

      // 2. Award +20 Loyalty Points for writing a review
      await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { increment: 20 } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          customerId,
          orderId: order.id,
          type: 'BONUS',
          points: 20,
          description: `Bonus points for reviewing order #${order.orderNumber}`,
        },
      });

      return review;
    });

    io.to(`branch:${order.branchId}`).emit('review:new', result);
    return result;
  }

  async replyReview(reviewId: number, managerReply: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('Review not found');

    return prisma.review.update({
      where: { id: reviewId },
      data: { managerReply },
    });
  }

  async getPublicReviews(branchId?: number, limit = 10) {
    return prisma.review.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        isVisible: true,
      },
      include: {
        customer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllReviews(params: {
    branchId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.branchId ? { branchId: params.branchId } : {}),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          order: { select: { id: true, orderNumber: true, totalAmount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return formatPaginatedResult(reviews, total, page, limit);
  }
}

export const reviewsService = new ReviewsService();
