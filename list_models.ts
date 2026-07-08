
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("GEMINI_API_KEY is missing");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    // Correct way to list models in @google/genai
    const models = await ai.models.list();                
    console.log("Flash models:", models.filter(m => m.name.includes("flash")).map(m => m.name));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}
run();
