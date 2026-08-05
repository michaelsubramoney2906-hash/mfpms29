const { GoogleGenAI } = require("@google/genai");

async function test() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Tell me about Gender Based Violence & Femicide, teenage pregnancy, drug abuse, deaths on accident scenes.",
      config: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });
    console.log(response.text);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
