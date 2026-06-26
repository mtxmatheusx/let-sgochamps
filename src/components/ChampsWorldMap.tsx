// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { ChampMapData, ChampMapPoint } from "@/lib/profiles";

// Lightweight world atlas (countries-110m), served from a CDN. No API key.
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function ChampsWorldMap({ data }: { data: ChampMapData }) {
  const [hover, setHover] = useState<{ p: ChampMapPoint; x: number; y: number } | null>(null);
  const { points, totals } = data;

  const sizeFor = (n: number) => Math.min(14, 4 + Math.sqrt(n) * 2.2);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="relative mb-10 overflow-hidden rounded-[28px] glass p-6 sm:p-8"
    >
      <div className="orb" style={{ width: 360, height: 360, top: -120, right: -120, background: "#60a5fa", opacity: 0.18 }} />

      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sage">
            The movement
          </div>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-navy sm:text-[30px]">
            Champs around the world
          </h2>
          <p className="mt-1 max-w-[520px] text-[13.5px] text-navy/70">
            Every dot is a champ showing up. Add your city in your profile to put yourself on the map.
          </p>
        </div>

        <div className="flex gap-5 text-right">
          <Stat n={totals.countries} label="countries" />
          <Stat n={totals.cities} label="cities" />
          <Stat n={totals.champs} label="champs" />
        </div>
      </div>

      <div className="relative">
        <ComposableMap
          projectionConfig={{ scale: 155 }}
          width={980}
          height={460}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: "rgba(15, 23, 42, 0.06)", stroke: "rgba(15,23,42,0.12)", strokeWidth: 0.5, outline: "none" },
                    hover: { fill: "rgba(15,23,42,0.10)", outline: "none" },
                    pressed: { fill: "rgba(15,23,42,0.10)", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {points.map((p, i) => {
            const r = sizeFor(p.count);
            return (
              <Marker key={i} coordinates={[p.lng, p.lat]}>
                <circle
                  r={r + 6}
                  fill="rgba(34,197,94,0.18)"
                  style={{ pointerEvents: "none" }}
                />
                <circle
                  r={r}
                  fill="#22c55e"
                  stroke="white"
                  strokeWidth={1.5}
                  style={{ cursor: "pointer", filter: "drop-shadow(0 2px 6px rgba(34,197,94,0.45))" }}
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGElement).getBoundingClientRect();
                    const parent = (e.currentTarget.ownerSVGElement?.parentElement as HTMLElement)?.getBoundingClientRect();
                    setHover({
                      p,
                      x: rect.left + rect.width / 2 - (parent?.left ?? 0),
                      y: rect.top - (parent?.top ?? 0),
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              </Marker>
            );
          })}
        </ComposableMap>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-navy px-3 py-1.5 text-[12px] font-medium text-white shadow-xl"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <div className="whitespace-nowrap">{hover.p.city ?? "Somewhere on Earth"}</div>
            <div className="text-[11px] opacity-70">
              {hover.p.count} champ{hover.p.count === 1 ? "" : "s"}
            </div>
          </div>
        )}

        {points.length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-2xl bg-white/85 px-5 py-3 text-center text-[13px] text-navy/75 backdrop-blur">
              Be the first dot — add your city in your profile.
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-[26px] font-semibold leading-none text-navy">{n}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-sage">{label}</div>
    </div>
  );
}
