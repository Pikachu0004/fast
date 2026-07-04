import { handleApiRequest } from "../server/api.js";

export default function handler(request, response) {
  return handleApiRequest(request, response);
}
