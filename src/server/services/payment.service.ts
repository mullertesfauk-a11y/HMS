import "server-only";

import { notImplemented } from "@/server/services/not-implemented";

/**
 * Payment service.
 *
 * MVP: payment records are created with the reservation (status PENDING) and
 * marked PAID when the hotel records payment — no gateway integration.
 *
 * The service is the seam where a payment provider (Stripe, etc.) plugs in
 * later, and where food/folio charges can attach beyond room charges.
 */
export class PaymentService {
  /** Record a payment against a reservation (called from reservation flows). */
  async recordPayment(_params: {
    reservationId: string;
    amount: number;
    currency: string;
    method: string;
  }): Promise<unknown> {
    return notImplemented("Phase 3 — reservation creation transaction");
  }
}

export const paymentService = new PaymentService();
