import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Geocode the caller's `location` string via the Google Maps connector gateway
 *  and store lat/lng/country back onto their profile. Best-effort: any failure
 *  just leaves the coordinates null so the profile save still succeeds. */
export const geocodeMyLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { location: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const loc = (data.location ?? "").trim();

    if (!loc) {
      await supabase
        .from("profiles")
        .update({ location_lat: null, location_lng: null, location_country: null })
        .eq("id", userId);
      return { ok: true, cleared: true };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    const connKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || !connKey) {
      console.warn("[geocode] Google Maps connector secrets missing");
      return { ok: false, reason: "no_connector" };
    }

    try {
      const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?address=${encodeURIComponent(loc)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Connection-Api-Key": connKey,
        },
      });
      if (!res.ok) {
        console.warn("[geocode] gateway HTTP", res.status);
        return { ok: false, reason: "http_" + res.status };
      }
      const json: any = await res.json();
      const first = json?.results?.[0];
      if (!first) return { ok: false, reason: "no_match" };

      const lat = first.geometry?.location?.lat;
      const lng = first.geometry?.location?.lng;
      const country = (first.address_components ?? []).find((c: any) =>
        Array.isArray(c.types) && c.types.includes("country"),
      )?.short_name ?? null;

      if (typeof lat !== "number" || typeof lng !== "number") {
        return { ok: false, reason: "no_coords" };
      }

      await supabase
        .from("profiles")
        .update({ location_lat: lat, location_lng: lng, location_country: country })
        .eq("id", userId);

      return { ok: true, lat, lng, country };
    } catch (err: any) {
      console.error("[geocode] failed:", err?.message ?? err);
      return { ok: false, reason: "exception" };
    }
  });
