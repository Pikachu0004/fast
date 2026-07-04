import { hasGemini } from "../services/gemini.js";

export function healthPayload() {
  return {
    ok: true,
    services: {
      places: "openstreetmap",
      weather: "open-meteo",
      gemini: hasGemini() ? "configured" : "not_configured",
      events: process.env.EVENTS_API_KEY ? "configured" : "not_configured",
      requests: process.env.VERCEL ? "ephemeral_append_only_ledger" : "local_append_only_ledger"
    }
  };
}
