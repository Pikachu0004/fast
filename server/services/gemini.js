export function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askGemini({ system, prompt, responseJson = false }) {
  if (!hasGemini()) {
    const error = new Error("Gemini API key is not configured");
    error.status = 503;
    error.code = "GEMINI_NOT_CONFIGURED";
    throw error;
  }

  const url = new URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent");
  url.searchParams.set("key", process.env.GEMINI_API_KEY);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: responseJson ? { responseMimeType: "application/json" } : undefined
    })
  });

  if (!response.ok) {
    const error = new Error(`Gemini request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() || "";
}
