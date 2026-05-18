import { GoogleGenAI } from "@google/genai";
async function test() {
  const apiKey = process.env.GEMINIAPIKEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: "Hello",
    });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error length:", e.message.length, "Message:", e.message);
  }
}
test();
