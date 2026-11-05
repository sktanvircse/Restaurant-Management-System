import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

export class BranchesService {
  async getBranches() {
    return prisma.branch.findMany({
      include: {
        _count: {
          select: {
            tables: true,
            menuItems: true,
            employees: true,
            orders: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async getBranchById(id: number) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        tables: true,
        settings: true,
        deliveryZones: true,
        paymentMethods: true,
      },
    });

    if (!branch) throw new NotFoundError('Branch not found');
    return branch;
  }

  async createBranch(data: any) {
    return prisma.branch.create({ data });
  }

  async updateBranch(id: number, data: any) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError('Branch not found');

    return prisma.branch.update({
      where: { id },
      data,
    });
  }
}

export const branchesService = new BranchesService();
