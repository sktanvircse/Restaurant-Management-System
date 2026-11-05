import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { formatPaginatedResult } from '../../utils/pagination';

export class CustomersService {
  async getCustomers(search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          loyaltyPoints: true,
          isGuest: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return formatPaginatedResult(customers, total, page, limit);
  }

  async getCustomerById(id: number) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { menuItem: true } } },
        },
        loyaltyTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  }

  async updateProfile(id: number, data: any) {
    return prisma.customer.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        loyaltyPoints: true,
      },
    });
  }

  async getAddresses(customerId: number) {
    return prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addAddress(customerId: number, data: any) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        ...data,
        customerId,
      },
    });
  }

  async deleteAddress(customerId: number, addressId: number) {
    const addr = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!addr) throw new NotFoundError('Address not found');

    await prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }

  async getCustomerOrders(customerId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId, deletedAt: null },
        include: {
          items: {
            include: {
              menuItem: { select: { id: true, name: true, image: true } },
              variant: { select: { id: true, name: true } },
              addons: { include: { addon: { select: { name: true } } } },
            },
          },
          delivery: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { customerId, deletedAt: null } }),
    ]);

    return formatPaginatedResult(orders, total, page, limit);
  }
}

export const customersService = new CustomersService();
