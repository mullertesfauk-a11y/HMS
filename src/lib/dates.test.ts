import { describe, expect, it } from "vitest";

import {
  calculateNights,
  hotelDateToUtc,
  isValidDateRange,
  rangesOverlap,
  utcToHotelDate,
} from "@/lib/dates";

describe("hotelDateToUtc / utcToHotelDate", () => {
  it("round-trips date-only values without timezone drift", () => {
    expect(utcToHotelDate(hotelDateToUtc("2026-08-20")!)).toBe("2026-08-20");
    expect(utcToHotelDate(hotelDateToUtc("2026-01-31")!)).toBe("2026-01-31");
    expect(utcToHotelDate(hotelDateToUtc("2026-12-01")!)).toBe("2026-12-01");
  });

  it("rejects malformed and non-existent calendar dates", () => {
    expect(hotelDateToUtc("2026-02-30")).toBeNull();
    expect(hotelDateToUtc("2026-13-01")).toBeNull();
    expect(hotelDateToUtc("2026-00-10")).toBeNull();
    expect(hotelDateToUtc("08/20/2026")).toBeNull();
    expect(hotelDateToUtc("2026-8-2")).toBeNull();
  });

  it("leap years are handled", () => {
    expect(utcToHotelDate(hotelDateToUtc("2028-02-29")!)).toBe("2028-02-29");
    expect(hotelDateToUtc("2027-02-29")).toBeNull();
  });
});

describe("calculateNights", () => {
  it("counts nights for a multi-night stay", () => {
    expect(calculateNights(hotelDateToUtc("2026-08-20")!, hotelDateToUtc("2026-08-23")!)).toBe(3);
  });

  it("single night stay", () => {
    expect(calculateNights(hotelDateToUtc("2026-08-20")!, hotelDateToUtc("2026-08-21")!)).toBe(1);
  });

  it("zero nights when checkIn equals checkOut", () => {
    expect(calculateNights(hotelDateToUtc("2026-08-20")!, hotelDateToUtc("2026-08-20")!)).toBe(0);
  });
});

describe("isValidDateRange", () => {
  it("requires checkIn strictly before checkOut", () => {
    expect(isValidDateRange(hotelDateToUtc("2026-08-20")!, hotelDateToUtc("2026-08-23")!)).toBe(true);
    expect(isValidDateRange(hotelDateToUtc("2026-08-23")!, hotelDateToUtc("2026-08-23")!)).toBe(false);
    expect(isValidDateRange(hotelDateToUtc("2026-08-25")!, hotelDateToUtc("2026-08-23")!)).toBe(false);
  });
});

describe("rangesOverlap — the core availability rule", () => {
  const d = (value: string) => hotelDateToUtc(value)!;

  it("no existing reservation for the dates → no overlap", () => {
    expect(rangesOverlap(d("2026-08-20"), d("2026-08-23"), d("2026-09-01"), d("2026-09-05"))).toBe(
      false,
    );
  });

  it("overlapping stay → overlap (spec example: Aug 22→25 vs Aug 20→23)", () => {
    expect(rangesOverlap(d("2026-08-20"), d("2026-08-23"), d("2026-08-22"), d("2026-08-25"))).toBe(
      true,
    );
  });

  it("exact checkout/check-in boundary → NO overlap (next guest allowed: Aug 23→25)", () => {
    expect(rangesOverlap(d("2026-08-20"), d("2026-08-23"), d("2026-08-23"), d("2026-08-25"))).toBe(
      false,
    );
  });

  it("requested stay contained inside existing stay → overlap", () => {
    expect(rangesOverlap(d("2026-08-20"), d("2026-08-30"), d("2026-08-22"), d("2026-08-25"))).toBe(
      true,
    );
  });

  it("existing stay contained inside requested stay → overlap", () => {
    expect(rangesOverlap(d("2026-08-22"), d("2026-08-25"), d("2026-08-20"), d("2026-08-30"))).toBe(
      true,
    );
  });

  it("identical dates → overlap", () => {
    expect(rangesOverlap(d("2026-08-20"), d("2026-08-23"), d("2026-08-20"), d("2026-08-23"))).toBe(
      true,
    );
  });

  it("back-to-back with gap → no overlap", () => {
    expect(rangesOverlap(d("2026-08-20"), d("2026-08-23"), d("2026-08-24"), d("2026-08-27"))).toBe(
      false,
    );
  });
});
