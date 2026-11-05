import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { io } from '../../server';

export class MenuService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  async getCategories(branchId?: number, includeInactive = false) {
    return prisma.category.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        children: true,
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategoryById(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        menuItems: {
          where: { deletedAt: null },
        },
      },
    });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async createCategory(data: {
    name: string;
    branchId: number;
    slug?: string;
    parentId?: number | null;
    image?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const slug = data.slug || this.generateSlug(data.name);

    const existing = await prisma.category.findUnique({
      where: { branchId_slug: { branchId: data.branchId, slug } },
    });
    if (existing) {
      throw new ConflictError('A category with this name already exists in this branch');
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        branchId: data.branchId,
        parentId: data.parentId || null,
        image: data.image || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    io.to(`branch:${data.branchId}`).emit('menu:category:created', category);
    return category;
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      slug?: string;
      parentId?: number | null;
      image?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category not found');

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(data.name && !data.slug ? { slug: this.generateSlug(data.name) } : {}),
      },
    });

    io.to(`branch:${category.branchId}`).emit('menu:category:updated', updated);
    return updated;
  }

  async deleteCategory(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category not found');

    await prisma.category.delete({ where: { id } });
    io.to(`branch:${category.branchId}`).emit('menu:category:deleted', { id });
    return { success: true };
  }

  // ==========================================
  // MENU ITEMS
  // ==========================================

  async getMenuItems(filters: {
    branchId?: number;
    categoryId?: number;
    station?: string;
    isAvailable?: boolean;
    search?: string;
    isFeatured?: boolean;
  }) {
    const where: any = {
      deletedAt: null,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.station ? { station: filters.station } : {}),
      ...(filters.isAvailable !== undefined ? { isAvailable: filters.isAvailable } : {}),
      ...(filters.isFeatured !== undefined ? { isFeatured: filters.isFeatured } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search } },
              { description: { contains: filters.search } },
            ],
          }
        : {}),
    };

    return prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
        addonGroups: {
          include: { addons: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getMenuItemById(id: number) {
    const item = await prisma.menuItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        variants: true,
        addonGroups: {
          include: { addons: true },
        },
        recipes: {
          include: { ingredient: true },
        },
      },
    });

    if (!item) throw new NotFoundError('Menu item not found');
    return item;
  }

  async createMenuItem(
    data: {
      categoryId: number;
      branchId: number;
      name: string;
      slug?: string;
      description?: string | null;
      image?: string | null;
      basePrice: number;
      station?: string;
      isAvailable?: boolean;
      isFeatured?: boolean;
      allergens?: string | null;
      prepTime?: number;
      sortOrder?: number;
      variants?: Array<{
        name: string;
        priceModifier: number;
        isDefault: boolean;
        isAvailable: boolean;
      }>;
      addonGroups?: Array<{
        name: string;
        isRequired: boolean;
        minSelect: number;
        maxSelect: number;
        addons: Array<{ name: string; price: number; isAvailable: boolean }>;
      }>;
    },
    createdByUserId?: number
  ) {
    const slug = data.slug || this.generateSlug(data.name);

    const existing = await prisma.menuItem.findFirst({
      where: { branchId: data.branchId, slug, deletedAt: null },
    });
    if (existing) {
      throw new ConflictError('A menu item with this name already exists in this branch');
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        categoryId: data.categoryId,
        branchId: data.branchId,
        name: data.name,
        slug,
        description: data.description || null,
        image: data.image || null,
        basePrice: data.basePrice,
        station: data.station || 'MAIN',
        isAvailable: data.isAvailable ?? true,
        isFeatured: data.isFeatured ?? false,
        allergens: data.allergens || null,
        prepTime: data.prepTime ?? 15,
        sortOrder: data.sortOrder ?? 0,
        createdBy: createdByUserId || null,
        variants: data.variants
          ? {
              create: data.variants,
            }
          : undefined,
        addonGroups: data.addonGroups
          ? {
              create: data.addonGroups.map((group) => ({
                name: group.name,
                isRequired: group.isRequired,
                minSelect: group.minSelect,
                maxSelect: group.maxSelect,
                addons: {
                  create: group.addons,
                },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
        addonGroups: {
          include: { addons: true },
        },
      },
    });

    io.to(`branch:${data.branchId}`).emit('menu:item:created', menuItem);
    return menuItem;
  }

  async updateMenuItem(
    id: number,
    data: any
  ) {
    const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Menu item not found');

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.name && !data.slug ? { slug: this.generateSlug(data.name) } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
        ...(data.station ? { station: data.station } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.allergens !== undefined ? { allergens: data.allergens } : {}),
        ...(data.prepTime !== undefined ? { prepTime: data.prepTime } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
      include: {
        category: true,
        variants: true,
        addonGroups: {
          include: { addons: true },
        },
      },
    });

    io.to(`branch:${item.branchId}`).emit('menu:item:updated', updated);
    return updated;
  }

  /**
   * Quick toggle item availability (86 item button)
   * Accessible by Manager, Chef, Kitchen staff to mark items out-of-stock instantly!
   */
  async toggleAvailability(id: number, isAvailable: boolean) {
    const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Menu item not found');

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    // Real-time broadcast to all devices in the branch (POS, Website, App, Kitchen)
    io.to(`branch:${item.branchId}`).emit('menu:item:availability', {
      itemId: id,
      name: item.name,
      isAvailable,
    });

    return updated;
  }

  async softDeleteMenuItem(id: number) {
    const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Menu item not found');

    await prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    io.to(`branch:${item.branchId}`).emit('menu:item:deleted', { id });
    return { success: true };
  }
}

export const menuService = new MenuService();
