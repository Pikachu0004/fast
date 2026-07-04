import { askGemini } from "../services/gemini.js";
import { validatePlaceContext } from "../validators.js";

export async function heritageNote(raw) {
  const input = validatePlaceContext(raw);
  const note = await askGemini({
    system: "Use only supplied facts. If facts are thin, state that details are unavailable. Never invent dates, people, legends, or claims.",
    prompt: `Place: ${JSON.stringify(input.place)}\nContext: ${JSON.stringify({ city: input.city, interests: input.interests })}\nWrite 3 concise heritage sentences.`,
    responseJson: false
  });
  return { note, source: "gemini", stamp: "heritage" };
}

export async function storyMode(raw) {
  const input = validatePlaceContext(raw);
  const transcript = await askGemini({
    system: "Create a grounded 150-word audio-guide transcript. Use only supplied place facts and clearly avoid unsupported historical claims.",
    prompt: `Place: ${JSON.stringify(input.place)}\nContext: ${JSON.stringify(input)}\nWrite a warm transcript.`,
    responseJson: false
  });
  return { transcript, source: "gemini", audioStatus: "transcript_only", stamp: "story" };
}
