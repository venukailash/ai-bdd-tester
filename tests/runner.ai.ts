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
      tools: [mcpToTool(playwrightClient)], // Inject Playwright MCP Client as Tool
    },
    contents: prompt,
  });

  for await (const chunk of response) {
    if (chunk.functionCalls && chunk.functionCalls.length > 0) {
      for (const functionCall of chunk.functionCalls) {
        console.log(`Function to call: ${functionCall.name}`);
        console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
      }
    }

    const candidates = chunk.candidates || [];
    for (const candidate of candidates) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) console.log(`Text part : ${part.text}`);
          if (part.thought) console.log(`Thought: ${part.thought}`);
          if (part.executableCode && part.executableCode.code) {
            console.log(`Executable Code: ${part.executableCode.code}`);
          }
          if (part.codeExecutionResult && part.codeExecutionResult.output) {
            console.log(
              `Code Execution Output: ${part.codeExecutionResult.output}`
            );
          }
        }
      }
    }
  }

  await playwrightClient.close();
}

main();
