"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Printer, Download, Sparkles, Wifi, Globe, Smartphone, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { HotelLogo } from "@/components/ui/hotel-logo";
import { Button } from "@/components/ui/button";

export interface TableQrCardProps {
  initialUrl?: string;
  hotelName?: string;
  city?: string;
}

export function TableQrCard({
  initialUrl = "https://gurjahotel.com/menu",
  hotelName = "Gurja Hotel",
  city = "Shire, Tigray",
}: TableQrCardProps) {
  const [url, setUrl] = useState(initialUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [template, setTemplate] = useState<"ivory" | "midnight" | "emerald" | "tent">("ivory");
  const [tableNumber, setTableNumber] = useState<string>("Table 01");
  const [showTableNum, setShowTableNum] = useState<boolean>(true);
  const [showWifi, setShowWifi] = useState<boolean>(true);
  const [wifiSsid, setWifiSsid] = useState<string>("Gurja_Guest_5G");
  const [wifiPass, setWifiPass] = useState<string>("Gurja2026!");
  const [purpose, setPurpose] = useState<string>("concierge"); // "concierge" | "menu" | "wifi" | "rooms"

  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-detect current host if needed
  const [currentOrigin, setCurrentOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  // Generate QR code when url changes
  useEffect(() => {
    async function generateQr() {
      try {
        const cleanTarget = url.trim() || "https://gurjahotel.com/menu";
        const dataUrl = await QRCode.toDataURL(cleanTarget, {
          width: 600,
          margin: 2,
          color: {
            dark: "#1c1917", // deep charcoal
            light: "#ffffff",
          },
          errorCorrectionLevel: "H", // Maximum error correction (up to 30% redundancy) for 100% camera scanning accuracy
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    }
    generateQr();
  }, [url]);

  const purposeLabels: Record<string, { title: string; subtitle: string; icon: string }> = {
    concierge: {
      title: "DIGITAL CONCIERGE & BOOKINGS",
      subtitle: "Scan to explore rooms, reserve dining, or contact the front desk",
      icon: "✦",
    },
    menu: {
      title: "RESTAURANT & IN-SUITE DINING",
      subtitle: "Scan to view our culinary menu, wine list, and daily specials",
      icon: "✦",
    },
    rooms: {
      title: "SUITES & RESERVATIONS",
      subtitle: "Scan to book your next stay or discover luxury accommodations",
      icon: "✦",
    },
    wifi: {
      title: "GUEST WELCOME & SERVICES",
      subtitle: "Scan to connect to high-speed internet and access guest amenities",
      icon: "✦",
    },
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `gurja-hotel-qr-${tableNumber.replace(/\s+/g, "_").toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      {/* Control Panel (Hidden during print) */}
      <div className="no-print mb-12 rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-stone-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Printable Table Stand Generator</span>
            </div>
            <h1 className="mt-2 font-luxury text-2xl sm:text-3xl font-semibold text-stone-900">
              Luxury QR Table Tent &amp; Stand Card
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              High-resolution, print-ready table display card for tables, suites, reception, and lounges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              className="h-11 gap-2 bg-brand px-6 text-xs font-semibold uppercase tracking-widest text-white shadow-lg hover:bg-brand-dark"
            >
              <Printer className="h-4 w-4" />
              <span>Print Card (A4 / 5x7&quot;)</span>
            </Button>
            <Button
              onClick={handleDownload}
              variant="secondary"
              className="h-11 gap-2 border-stone-300 text-xs font-semibold uppercase tracking-widest text-stone-700 hover:bg-stone-50"
            >
              <Download className="h-4 w-4" />
              <span>Download QR</span>
            </Button>
          </div>
        </div>

        {/* Customization Grid */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Target Website */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Target Destination URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="https://gurjahotel.com/menu"
            />
            {/* Quick URL Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setUrl("https://gurjahotel.com/menu")}
                className="rounded bg-stone-100 px-2 py-0.5 text-stone-700 hover:bg-stone-200"
              >
                gurjahotel.com/menu
              </button>
              <button
                type="button"
                onClick={() => setUrl("https://www.gurjahotel.com/menu")}
                className="rounded bg-stone-100 px-2 py-0.5 text-stone-700 hover:bg-stone-200"
              >
                www.gurjahotel.com/menu
              </button>
              {currentOrigin && (
                <button
                  type="button"
                  onClick={() => setUrl(currentOrigin)}
                  className="rounded bg-amber-100 px-2 py-0.5 text-amber-800 hover:bg-amber-200 font-medium"
                  title="Use current website address for live phone testing"
                >
                  Current Host ({currentOrigin.replace(/https?:\/\//, "")})
                </button>
              )}
            </div>
          </div>

          {/* Template Style */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Luxury Theme
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="mt-1.5 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="ivory">Ivory &amp; Burnished Brass (Classic)</option>
              <option value="midnight">Midnight &amp; Gold (Obsidian)</option>
              <option value="emerald">Imperial Forest &amp; Brass</option>
              <option value="tent">Double-Sided Foldable Tent Card</option>
            </select>
          </div>

          {/* Table / Room Label */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Table / Location Identifier
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Table 01 / Suite 204"
            />
          </div>

          {/* Display Purpose */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Card Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="concierge">Digital Concierge &amp; Bookings</option>
              <option value="menu">Restaurant &amp; In-Suite Dining</option>
              <option value="rooms">Suites &amp; Room Reservations</option>
              <option value="wifi">Guest Welcome &amp; Wi-Fi</option>
            </select>
          </div>
        </div>

        {/* Wi-Fi Credentials Toggle */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-stone-100 pt-5 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showWifi}
              onChange={(e) => setShowWifi(e.target.checked)}
              className="rounded border-stone-300 text-brand focus:ring-brand"
            />
            <span className="font-medium text-stone-700">Include Wi-Fi network credentials on card</span>
          </label>

          {showWifi && (
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Wi-Fi SSID"
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs text-stone-800"
              />
              <input
                type="text"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                placeholder="Password"
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs text-stone-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Print Instructions Callout */}
      <div className="no-print mb-8 rounded-xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base">💡</span>
          <span>
            <strong>Printing Tip:</strong> In your browser print dialog (Ctrl/Cmd + P), set <strong>Scale to 100%</strong>, choose <strong>Portrait</strong>, and enable <strong>&ldquo;Background graphics&rdquo;</strong> for rich colors and crisp brass borders.
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="hidden sm:inline-flex font-semibold text-brand underline cursor-pointer"
        >
          Print Now &rarr;
        </button>
      </div>

      {/* Printable Display Canvas */}
      <div className="flex justify-center items-center py-4 print:p-0">
        {/* Single Stand Card or Tent Card */}
        {template === "tent" ? (
          /* Foldable Table Tent (Front + Back with Fold Line) */
          <div
            ref={cardRef}
            className="print-area flex flex-col items-center bg-white border border-dashed border-stone-300 print:border-none shadow-2xl print:shadow-none p-6 sm:p-10 w-[380px] sm:w-[460px] print:w-full print:max-w-[480px]"
          >
            {/* Top / Back Face (Inverted for tent fold) */}
            <div className="w-full rotate-180 transform pb-8 border-b-2 border-dashed border-stone-300 print:border-stone-400">
              <StandCardFace
                variant="ivory"
                url={url}
                qrDataUrl={qrDataUrl}
                tableNumber={tableNumber}
                showTableNum={showTableNum}
                showWifi={showWifi}
                wifiSsid={wifiSsid}
                wifiPass={wifiPass}
                purposeInfo={purposeLabels[purpose]}
                city={city}
              />
            </div>

            {/* Fold Guide Line */}
            <div className="w-full py-2 text-center text-[10px] uppercase tracking-widest text-stone-400 select-none">
              — FOLD HERE FOR TABLE STAND —
            </div>

            {/* Bottom / Front Face */}
            <div className="w-full pt-8">
              <StandCardFace
                variant="ivory"
                url={url}
                qrDataUrl={qrDataUrl}
                tableNumber={tableNumber}
                showTableNum={showTableNum}
                showWifi={showWifi}
                wifiSsid={wifiSsid}
                wifiPass={wifiPass}
                purposeInfo={purposeLabels[purpose]}
                city={city}
              />
            </div>
          </div>
        ) : (
          /* Single Luxury Stand Card (Fits standard 5x7 or A5/A4 table frame) */
          <div
            ref={cardRef}
            className="print-area w-[360px] sm:w-[420px] print:w-full print:max-w-[440px] shadow-2xl print:shadow-none"
          >
            <StandCardFace
              variant={template}
              url={url}
              qrDataUrl={qrDataUrl}
              tableNumber={tableNumber}
              showTableNum={showTableNum}
              showWifi={showWifi}
              wifiSsid={wifiSsid}
              wifiPass={wifiPass}
              purposeInfo={purposeLabels[purpose]}
              city={city}
            />
          </div>
        )}
      </div>

      {/* Embedded Print CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          footer,
          nav,
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            margin: 0 auto !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

/** Individual Face of the Luxury Table Stand */
function StandCardFace({
  variant,
  url,
  qrDataUrl,
  tableNumber,
  showTableNum,
  showWifi,
  wifiSsid,
  wifiPass,
  purposeInfo,
  city,
}: {
  variant: "ivory" | "midnight" | "emerald";
  url: string;
  qrDataUrl: string;
  tableNumber: string;
  showTableNum: boolean;
  showWifi: boolean;
  wifiSsid: string;
  wifiPass: string;
  purposeInfo: { title: string; subtitle: string; icon: string };
  city: string;
}) {
  const isDark = variant === "midnight";
  const isEmerald = variant === "emerald";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-7 text-center transition-colors ${
        isDark
          ? "border-amber-400/50 bg-stone-950 text-white"
          : isEmerald
          ? "border-amber-400/50 bg-[#163325] text-white"
          : "border-stone-800 bg-[#fdfbf7] text-stone-900"
      }`}
      style={{
        boxShadow: isDark
          ? "inset 0 0 0 4px #1c1917, inset 0 0 0 6px #d97706"
          : isEmerald
          ? "inset 0 0 0 4px #0d2118, inset 0 0 0 6px #b08d57"
          : "inset 0 0 0 4px #fdfbf7, inset 0 0 0 6px #b08d57",
      }}
    >
      {/* Decorative Corner Filigree Motifs */}
      <div className="absolute top-2 left-2 text-[10px] text-amber-500/60 select-none">✦</div>
      <div className="absolute top-2 right-2 text-[10px] text-amber-500/60 select-none">✦</div>
      <div className="absolute bottom-2 left-2 text-[10px] text-amber-500/60 select-none">✦</div>
      <div className="absolute bottom-2 right-2 text-[10px] text-amber-500/60 select-none">✦</div>

      {/* Header Badge */}
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="h-[1px] w-6 bg-amber-400/60" />
        <span
          className={`text-[9px] font-semibold uppercase tracking-[0.32em] ${
            isDark || isEmerald ? "text-amber-300" : "text-brand-brass"
          }`}
        >
          {city.toUpperCase()}
        </span>
        <span className="h-[1px] w-6 bg-amber-400/60" />
      </div>

      {/* Brand Text Logo Lockup */}
      <div className="mt-3 flex justify-center">
        <HotelLogo
          name="GURJA"
          subtitle="HOTEL"
          variant={isDark || isEmerald ? "light" : "dark"}
          size="lg"
          layout="stacked"
        />
      </div>

      {/* Table / Room identifier badge */}
      {tableNumber && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-500">
          <span>{tableNumber}</span>
        </div>
      )}

      {/* Purpose Headline */}
      <div className="mt-4">
        <p
          className={`font-luxury text-sm sm:text-base font-semibold uppercase tracking-[0.14em] ${
            isDark || isEmerald ? "text-amber-200" : "text-stone-900"
          }`}
        >
          {purposeInfo.title}
        </p>
        <p
          className={`mx-auto mt-1 max-w-[280px] text-[11px] leading-relaxed ${
            isDark || isEmerald ? "text-stone-300" : "text-stone-600"
          }`}
        >
          {purposeInfo.subtitle}
        </p>
      </div>

      {/* QR Code Frame with Gold Inset */}
      <div className="mt-5 flex justify-center">
        <div className="relative rounded-xl border-2 border-amber-400/60 bg-white p-3 shadow-lg">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to visit Gurja Hotel"
              className="h-44 w-44 sm:h-48 sm:w-48 object-contain"
            />
          ) : (
            <div className="flex h-44 w-44 sm:h-48 sm:w-48 items-center justify-center bg-stone-100 text-xs text-stone-400">
              Generating QR...
            </div>
          )}

          {/* Central Logo Stamp Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-stone-900 text-sm font-serif font-bold text-amber-200 shadow-md">
              G
            </div>
          </div>
        </div>
      </div>

      {/* Scan Instructions */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
        <Smartphone className="h-3.5 w-3.5" />
        <span>Open Camera to Scan</span>
      </div>

      {/* Website URL Link */}
      <p
        className={`mt-1 text-[11px] font-medium tracking-wider ${
          isDark || isEmerald ? "text-amber-200/80" : "text-stone-700"
        }`}
      >
        {url.replace(/^https?:\/\//, "")}
      </p>

      {/* Optional Wi-Fi Badge */}
      {showWifi && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-[10px] ${
            isDark || isEmerald
              ? "border-stone-800 bg-stone-900/80 text-stone-300"
              : "border-stone-200 bg-stone-100/70 text-stone-700"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 font-semibold uppercase tracking-wider text-amber-500">
            <Wifi className="h-3 w-3" />
            <span>Complimentary High-Speed Wi-Fi</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-3 font-mono text-[11px]">
            <span>
              Network: <strong>{wifiSsid}</strong>
            </span>
            <span>·</span>
            <span>
              Pass: <strong>{wifiPass}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Footer Tagline */}
      <div className="mt-4 border-t border-amber-400/30 pt-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-stone-400">
        Gurja Hotel &bull; Shire, Tigray, Ethiopia
      </div>
    </div>
  );
}
