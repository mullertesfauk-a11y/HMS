import "server-only";

import { ReservationStatus, RoomStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Operational dashboard metrics (admin).
 *
 * Every metric is computed from real reservation/room data and maps to a
 * click-through in the admin UI — never decorative.
 *
 * Definitions (MVP):
 *  - arrivalsToday: stays starting today, excluding cancelled/no-show/checked-out
 *  - departuresToday: confirmed or checked-in stays ending today
 *  - occupancy: rooms in OCCUPIED housekeeping status / total rooms
 *  - availableRooms: rooms in AVAILABLE housekeeping status
 *  - revenueToday: booking value of checked-in guests whose stay covers today
 */
export interface DashboardMetrics {
  arrivalsToday: number;
  departuresToday: number;
  occupancy: { occupied: number; total: number; percentage: number };
  availableRooms: number;
  pendingReservations: number;
  confirmedReservations: number;
  revenueToday: { amount: number; currency: string };
  date: string;
}

export class DashboardService {
  async getMetrics(hotelId: string, date: Date, currency: string): Promise<DashboardMetrics> {
    const todayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const [arrivalsToday, departuresToday, roomStats, pendingReservations, confirmedReservations, revenueAgg] =
      await Promise.all([
        prisma.reservation.count({
          where: {
            hotelId,
            checkIn: todayStart,
            status: { notIn: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW, ReservationStatus.CHECKED_OUT] },
          },
        }),
        prisma.reservation.count({
          where: {
            hotelId,
            checkOut: todayStart,
            status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
          },
        }),
        prisma.room.groupBy({
          by: ["status"],
          where: { hotelId },
          _count: { _all: true },
        }),
        prisma.reservation.count({ where: { hotelId, status: ReservationStatus.PENDING } }),
        prisma.reservation.count({ where: { hotelId, status: ReservationStatus.CONFIRMED } }),
        prisma.reservation.aggregate({
          where: {
            hotelId,
            status: ReservationStatus.CHECKED_IN,
            checkIn: { lte: todayStart },
            checkOut: { gt: todayStart },
          },
          _sum: { total: true },
        }),
      ]);

    const totalRooms = roomStats.reduce((sum, row) => sum + row._count._all, 0);
    const occupied = roomStats.find((row) => row.status === RoomStatus.OCCUPIED)?._count._all ?? 0;
    const availableRooms = roomStats.find((row) => row.status === RoomStatus.AVAILABLE)?._count._all ?? 0;

    return {
      arrivalsToday,
      departuresToday,
      occupancy: {
        occupied,
        total: totalRooms,
        percentage: totalRooms === 0 ? 0 : Math.round((occupied / totalRooms) * 100),
      },
      availableRooms,
      pendingReservations,
      confirmedReservations,
      revenueToday: {
        amount: revenueAgg._sum.total?.toNumber() ?? 0,
        currency,
      },
      date: `${todayStart.getUTCFullYear()}-${String(todayStart.getUTCMonth() + 1).padStart(2, "0")}-${String(todayStart.getUTCDate()).padStart(2, "0")}`,
    };
  }
}

export const dashboardService = new DashboardService();
