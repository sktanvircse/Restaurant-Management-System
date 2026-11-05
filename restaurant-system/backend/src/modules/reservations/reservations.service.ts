import { ReservationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';
import { formatPaginatedResult } from '../../utils/pagination';

export class ReservationsService {
  async createReservation(
    data: {
      branchId: number;
      guestName: string;
      guestPhone: string;
      guestEmail?: string | null;
      reservedAt: string;
      partySize: number;
      tablePreference?: string | null;
      tableId?: number | null;
      notes?: string | null;
    },
    customerId?: number | null
  ) {
    const reservationDate = new Date(data.reservedAt);
    if (reservationDate < new Date()) {
      throw new BadRequestError('Reservation date cannot be in the past');
    }

    const reservation = await prisma.reservation.create({
      data: {
        branchId: data.branchId,
        customerId: customerId || null,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail || null,
        reservedAt: reservationDate,
        partySize: data.partySize,
        tablePreference: data.tablePreference || null,
        tableId: data.tableId || null,
        notes: data.notes || null,
        status: 'PENDING',
      },
      include: {
        table: true,
        branch: { select: { id: true, name: true } },
      },
    });

    // Notify restaurant managers in real-time
    io.to(`branch:${data.branchId}`).emit('reservation:new', reservation);

    return reservation;
  }

  async getReservations(params: {
    branchId?: number;
    date?: string;
    status?: ReservationStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.date
        ? {
            reservedAt: {
              gte: new Date(new Date(params.date).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(params.date).setHours(23, 59, 59, 999)),
            },
          }
        : {}),
    };

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          table: { select: { id: true, tableNumber: true, section: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { reservedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return formatPaginatedResult(reservations, total, page, limit);
  }

  async updateStatus(
    id: number,
    status: ReservationStatus,
    tableId?: number | null,
    notes?: string | null
  ) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundError('Reservation not found');

    const updated = await prisma.$transaction(async (tx) => {
      const assignedTableId = tableId !== undefined ? tableId : reservation.tableId;

      const r = await tx.reservation.update({
        where: { id },
        data: {
          status,
          tableId: assignedTableId,
          notes: notes || reservation.notes,
        },
        include: { table: true },
      });

      // If status becomes SEATED and table is specified, mark table as OCCUPIED and open a table session!
      if (status === 'SEATED' && assignedTableId) {
        await tx.table.update({
          where: { id: assignedTableId },
          data: { status: 'OCCUPIED' },
        });

        // Open session if none active
        const existingSession = await tx.tableSession.findFirst({
          where: { tableId: assignedTableId, status: 'OPEN' },
        });

        if (!existingSession) {
          await tx.tableSession.create({
            data: {
              tableId: assignedTableId,
              status: 'OPEN',
            },
          });
        }
      }

      return r;
    });

    io.to(`branch:${reservation.branchId}`).emit('reservation:updated', {
      id,
      status,
      tableId: updated.tableId,
    });

    return updated;
  }
}

export const reservationsService = new ReservationsService();
