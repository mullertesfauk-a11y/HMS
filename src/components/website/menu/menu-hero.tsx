import type { PublicHotel } from "@/server/services/hotel.service";

export function MenuHero({ hotel }: { hotel: PublicHotel }) {
  return (
    <section className="relative overflow-hidden bg-stone-950 py-20 sm:py-28">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2600&auto=format&fit=crop"
          alt="Fine dining presentation"
          className="h-full w-full object-cover object-center brightness-[0.55] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-stone-950/80" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-stone-900/70 px-4 py-1.5 backdrop-blur-md">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200">
            {hotel.name || "GURJA HOTEL"}
          </span>
        </div>

        <h1 className="mt-5 font-luxury text-3xl font-normal uppercase tracking-[0.16em] text-white sm:text-4xl lg:text-5xl">
          Our Menu
        </h1>

        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="h-[1px] w-6 sm:w-10 bg-amber-300/50" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-300/80">
            Taste the Flavors of Ethiopia
          </p>
          <span className="h-[1px] w-6 sm:w-10 bg-amber-300/50" />
        </div>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-base">
          Discover carefully prepared dishes made with fresh ingredients and
          traditional Ethiopian flavors — from timeless classics to modern
          hotel specialties.
        </p>
      </div>
    </section>
  );
}
