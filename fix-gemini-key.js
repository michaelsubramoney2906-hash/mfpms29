import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. AI Extraction requires the Gemini API.");
      }`;

const newCheck = `const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.gemini;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. AI Extraction requires the Gemini API.");
      }`;

content = content.replace(oldCheck, newCheck);

const oldInit = `const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });`;
const newInit = `const ai = new GoogleGenAI({ apiKey });`;
content = content.replace(oldInit, newInit);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Fixed GEMINI_API_KEY variable reading.');
