import "server-only";

import { NotFoundError } from "@/lib/errors";
import { hotelRepository } from "@/server/repositories/hotel.repository";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import type { UpdateHotelSettingsInput } from "@/lib/validation/settings";

/**
 * Public website data service.
 *
 * Returns sanitized, domain-oriented views (no internal ids, no internal
 * status fields) so the public site and a future mobile app share one API.
 */
export interface PublicHotel {
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
}

/** Admin settings view of the hotel. */
export type HotelSettings = PublicHotel;

export interface PublicRoomType {
  slug: string;
  name: string;
  description: string | null;
  capacity: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  size: string | null;
  basePrice: number;
  amenities: { name: string; icon: string | null }[];
}

export class HotelService {
  /** The default (first) hotel — MVP is single-hotel. */
  async getDefaultHotel() {
    const hotel = await hotelRepository.findFirst();
    if (!hotel) throw new NotFoundError("Hotel is not configured");
    return hotel;
  }

  async getPublicHotel(): Promise<PublicHotel> {
    const hotel = await this.getDefaultHotel();
    return this.toHotelView(hotel);
  }

  /** Admin settings (same data as the public view — the Hotel IS the settings store). */
  async getSettings(): Promise<HotelSettings> {
    const hotel = await this.getDefaultHotel();
    return this.toHotelView(hotel);
  }

  async updateSettings(input: UpdateHotelSettingsInput): Promise<HotelSettings> {
    const hotel = await this.getDefaultHotel();
    const updated = await hotelRepository.update(hotel.id, input);
    return this.toHotelView(updated);
  }

  private toHotelView(hotel: {
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    currency: string;
    timezone: string;
    checkInTime: string;
    checkOutTime: string;
    taxRate: { toNumber(): number };
  }): PublicHotel {
    return {
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      phone: hotel.phone,
      email: hotel.email,
      currency: hotel.currency,
      timezone: hotel.timezone,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      taxRate: hotel.taxRate.toNumber(),
    };
  }

  async getRoomTypes(): Promise<PublicRoomType[]> {
    const hotel = await this.getDefaultHotel();
    const roomTypes = await roomTypeRepository.listActive(hotel.id);
    return roomTypes.map((roomType) => this.toPublicRoomType(roomType));
  }

  async getRoomTypeBySlug(slug: string): Promise<PublicRoomType> {
    const hotel = await this.getDefaultHotel();
    const roomType = await roomTypeRepository.findBySlug(hotel.id, slug);
    if (!roomType || roomType.status !== "ACTIVE") {
      throw new NotFoundError("Room type not found");
    }
    return this.toPublicRoomType(roomType);
  }

  private toPublicRoomType(roomType: {
    slug: string;
    name: string;
    description: string | null;
    capacity: number;
    maxAdults: number;
    maxChildren: number;
    bedType: string;
    size: string | null;
    basePrice: { toNumber(): number };
    amenities: { amenity: { name: string; icon: string | null } }[];
  }): PublicRoomType {
    return {
      slug: roomType.slug,
      name: roomType.name,
      description: roomType.description,
      capacity: roomType.capacity,
      maxAdults: roomType.maxAdults,
      maxChildren: roomType.maxChildren,
      bedType: roomType.bedType,
      size: roomType.size,
      basePrice: roomType.basePrice.toNumber(),
      amenities: roomType.amenities.map((link) => ({
        name: link.amenity.name,
        icon: link.amenity.icon,
      })),
    };
  }
}

export const hotelService = new HotelService();
