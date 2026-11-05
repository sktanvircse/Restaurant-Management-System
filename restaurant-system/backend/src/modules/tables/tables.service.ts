import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { TableStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';
import { io } from '../../server';
import { env } from '../../config/env';

export class TablesService {
  async getTables(branchId?: number, section?: string, status?: TableStatus) {
    return prisma.table.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(section ? { section } : {}),
        ...(status ? { status } : {}),
        isActive: true,
      },
      include: {
        sessions: {
          where: { status: 'OPEN' },
          include: {
            orders: {
              where: {
                status: {
                  notIn: ['PAID', 'CANCELLED', 'VOIDED'],
                },
              },
              select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
              },
            },
          },
        },
      },
      orderBy: [{ section: 'asc' }, { tableNumber: 'asc' }],
    });
  }

  async getTableById(id: number) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: 'OPEN' },
          include: {
            orders: {
              include: {
                items: {
                  include: { menuItem: true },
                },
              },
            },
          },
        },
      },
    });

    if (!table) throw new NotFoundError('Table not found');
    return table;
  }

  /**
   * Public endpoint for customer QR code ordering:
   * Customer scans table QR -> lands on website/app with this token -> verifies valid table.
   */
  async getTableByToken(qrToken: string) {
    const table = await prisma.table.findUnique({
      where: { qrToken },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            currency: true,
            taxRate: true,
            serviceChargeRate: true,
          },
        },
        sessions: {
          where: { status: 'OPEN' },
        },
      },
    });

    if (!table || !table.isActive) {
      throw new NotFoundError('Table QR token is invalid or inactive');
    }

    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section,
      branch: table.branch,
      hasActiveSession: table.sessions.length > 0,
      activeSessionId: table.sessions[0]?.id || null,
    };
  }

  async createTable(data: {
    branchId: number;
    tableNumber: string;
    capacity?: number;
    section?: string | null;
    status?: TableStatus;
  }) {
    const existing = await prisma.table.findUnique({
      where: {
        branchId_tableNumber: {
          branchId: data.branchId,
          tableNumber: data.tableNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictError('A table with this number already exists in this branch');
    }

    const qrToken = uuidv4();
    const qrUrl = `${env.CUSTOMER_URL}/t/${qrToken}`;
    const qrImageUrl = await QRCode.toDataURL(qrUrl);

    const table = await prisma.table.create({
      data: {
        branchId: data.branchId,
        tableNumber: data.tableNumber,
        capacity: data.capacity ?? 4,
        section: data.section || null,
        status: data.status || 'AVAILABLE',
        qrToken,
        qrImageUrl,
      },
    });

    io.to(`branch:${table.branchId}`).emit('table:created', table);
    return table;
  }

  async updateTable(
    id: number,
    data: {
      tableNumber?: string;
      capacity?: number;
      section?: string | null;
      status?: TableStatus;
      isActive?: boolean;
    }
  ) {
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundError('Table not found');

    const updated = await prisma.table.update({
      where: { id },
      data,
    });

    io.to(`branch:${table.branchId}`).emit('table:updated', updated);
    return updated;
  }

  async getTableQRCode(id: number) {
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundError('Table not found');

    const qrUrl = `${env.CUSTOMER_URL}/t/${table.qrToken}`;
    const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      qrToken: table.qrToken,
      qrUrl,
      dataUrl,
    };
  }

  async openTableSession(tableId: number, staffUserId?: number) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        sessions: { where: { status: 'OPEN' } },
      },
    });

    if (!table) throw new NotFoundError('Table not found');

    if (table.sessions.length > 0) {
      return table.sessions[0];
    }

    const session = await prisma.tableSession.create({
      data: {
        tableId,
        openedBy: staffUserId || null,
        status: 'OPEN',
      },
    });

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' },
    });

    io.to(`branch:${table.branchId}`).emit('table:updated', {
      id: tableId,
      status: 'OCCUPIED',
      sessionId: session.id,
    });

    return session;
  }

  async closeTableSession(tableId: number) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        sessions: { where: { status: 'OPEN' } },
      },
    });

    if (!table) throw new NotFoundError('Table not found');

    if (table.sessions.length > 0) {
      await prisma.tableSession.update({
        where: { id: table.sessions[0].id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });
    }

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    });

    io.to(`branch:${table.branchId}`).emit('table:updated', {
      id: tableId,
      status: 'AVAILABLE',
    });

    return { success: true };
  }

  async updateTableStatus(tableId: number, status: TableStatus) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundError('Table not found');

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { status },
    });

    io.to(`branch:${table.branchId}`).emit('table:updated', updated);
    return updated;
  }

  async transferTable(fromTableId: number, toTableId: number) {
    const fromTable = await prisma.table.findUnique({
      where: { id: fromTableId },
      include: {
        sessions: {
          where: { status: 'OPEN' },
          include: { orders: true },
        },
      },
    });

    const toTable = await prisma.table.findUnique({
      where: { id: toTableId },
      include: {
        sessions: { where: { status: 'OPEN' } },
      },
    });

    if (!fromTable || !toTable) throw new NotFoundError('Table not found');
    if (!fromTable.sessions.length) throw new BadRequestError('Source table has no active session');

    const activeSession = fromTable.sessions[0];

    // Transfer session to new table
    await prisma.tableSession.update({
      where: { id: activeSession.id },
      data: { tableId: toTableId },
    });

    // Update table statuses
    await prisma.table.update({
      where: { id: fromTableId },
      data: { status: 'AVAILABLE' },
    });

    await prisma.table.update({
      where: { id: toTableId },
      data: { status: 'OCCUPIED' },
    });

    io.to(`branch:${fromTable.branchId}`).emit('table:transferred', {
      fromTableId,
      toTableId,
      sessionId: activeSession.id,
    });

    return { success: true, message: `Transferred session from ${fromTable.tableNumber} to ${toTable.tableNumber}` };
  }

  async deleteTable(id: number) {
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundError('Table not found');

    await prisma.table.update({
      where: { id },
      data: { isActive: false },
    });

    io.to(`branch:${table.branchId}`).emit('table:deleted', { id });
    return { success: true };
  }
}

export const tablesService = new TablesService();
