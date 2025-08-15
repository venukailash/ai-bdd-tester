import { getAllFeatures, getPlaywrightClient } from "./runner.utils";
import { GoogleGenAI, mcpToTool } from "@google/genai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const { playwrightClient, playwrightParams } = getPlaywrightClient();
await playwrightClient.connect(playwrightParams);

const prompt =
  "Test all the features and provide a report as pass/fail. Here are the features - " +
  getAllFeatures();

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    config: {
      tools: [mcpToTool(playwrightClient)],
    },
    contents: prompt,
  });
  for await (const chunk of response) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
    }
  }
  await playwrightClient.close();
}

main();
