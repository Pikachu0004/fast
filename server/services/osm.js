import { getCached, setCached } from "./cache.js";

const HEADERS = {
  "User-Agent": "WanderlorePromptWars/1.0 (local demo)"
};

export async function geocodeCity(city) {
  const key = `geocode:${city.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", city);
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`Geocoding failed with ${response.status}`);
  const data = await response.json();
  if (!data[0]) {
    const error = new Error("City not found");
    error.status = 404;
    throw error;
  }
  return setCached(key, {
    city,
    displayName: data[0].display_name,
    lat: Number(data[0].lat),
    lng: Number(data[0].lon)
  });
}

export async function fetchPlaces({ lat, lng }) {
  const key = `places:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  const cached = getCached(key);
  if (cached) return cached;

  const query = `
    [out:json][timeout:25];
    (
      node(around:4500,${lat},${lng})[tourism~"museum|attraction|gallery|viewpoint"];
      node(around:4500,${lat},${lng})[historic];
      node(around:4500,${lat},${lng})[amenity~"restaurant|cafe|theatre|arts_centre|marketplace|bar|pub"];
      node(around:4500,${lat},${lng})[leisure~"park|garden"];
      node(around:4500,${lat},${lng})[shop~"craft|art|antiques|books"];
      way(around:4500,${lat},${lng})[tourism~"museum|attraction|gallery|viewpoint"];
      way(around:4500,${lat},${lng})[historic];
      way(around:4500,${lat},${lng})[amenity~"restaurant|cafe|theatre|arts_centre|marketplace|bar|pub"];
      way(around:4500,${lat},${lng})[leisure~"park|garden"];
    );
    out center tags 80;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query })
  });
  if (!response.ok) throw new Error(`Places search failed with ${response.status}`);
  const data = await response.json();
  const places = data.elements
    .filter((item) => item.tags?.name)
    .map((item) => {
      const itemLat = item.lat ?? item.center?.lat;
      const itemLng = item.lon ?? item.center?.lon;
      return {
        id: `${item.type}-${item.id}`,
        name: item.tags.name,
        lat: itemLat,
        lng: itemLng,
        address: [item.tags["addr:street"], item.tags["addr:city"]].filter(Boolean).join(", "),
        website: item.tags.website || item.tags["contact:website"],
        tags: item.tags,
        distanceKm: distanceKm(lat, lng, itemLat, itemLng)
      };
    })
    .filter((place) => Number.isFinite(place.distanceKm));

  return setCached(key, places);
}

export async function fetchThreadHosts({ lat, lng }) {
  const places = await fetchPlaces({ lat, lng });
  return places
    .filter((place) => ["craft", "art", "food", "heritage"].some((term) => JSON.stringify(place.tags).toLowerCase().includes(term)))
    .slice(0, 8)
    .map((place) => ({
      id: place.id,
      name: place.name,
      area: place.address || `${place.distanceKm.toFixed(1)} km from city center`,
      craft: place.tags.shop || place.tags.tourism || place.tags.amenity || "local cultural experience",
      website: place.website,
      tags: place.tags
    }));
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return (value * Math.PI) / 180;
}
