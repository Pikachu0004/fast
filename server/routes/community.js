import { saveConnectionRequest } from "../dataStore.js";
import { fetchEvents } from "../services/events.js";
import { fetchThreadHosts, geocodeCity } from "../services/osm.js";
import { validateConnectionRequest, validateContext } from "../validators.js";

export async function localEvents(raw) {
  return { events: await fetchEvents(validateContext(raw)), stamp: "events", source: "ticketmaster" };
}

export async function threadHosts(raw) {
  const input = validateContext(raw);
  const city = await geocodeCity(input.city);
  return { hosts: await fetchThreadHosts(city), city, source: "openstreetmap" };
}

export async function connectionRequest(raw) {
  const receipt = await saveConnectionRequest(validateConnectionRequest(raw));
  return { ...receipt, stamp: "threads", source: "append-only-ledger" };
}
