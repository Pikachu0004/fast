import { getCached, setCached } from "./cache.js";

const WEATHER_LABELS = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  80: "rain showers",
  81: "heavy rain showers",
  82: "violent rain showers",
  95: "thunderstorm"
};

export async function fetchWeather({ lat, lng }) {
  const key = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lng);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "auto");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather lookup failed with ${response.status}`);
  const data = await response.json();
  const code = data.current?.weather_code ?? 0;
  return setCached(key, {
    code,
    label: WEATHER_LABELS[code] || "current conditions",
    temperatureC: data.current?.temperature_2m,
    observedAt: data.current?.time
  }, 5 * 60 * 1000);
}
