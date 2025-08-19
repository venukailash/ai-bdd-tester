import { getAllFeatures, getPlaywrightClient } from "./runner.utils";
import { GoogleGenAI, mcpToTool, Type } from "@google/genai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const { playwrightClient, playwrightParams } = getPlaywrightClient();
await playwrightClient.connect(playwrightParams);

const systemInstruction = `
  You are a software BDD tester with Playwright tool experience on Javascript.
  Provide a short summary for every step on how its tested and validated.
  Test all the features and provide a report as pass/fail.`;

const prompt = `Here are the features ` + getAllFeatures();

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemInstruction,
      tools: [mcpToTool(playwrightClient)], // Inject Playwright MCP Client as Tool
    },
    contents: prompt,
  });

  let stepResults = "";

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
          if (part.text) {
            console.log(`Text part : ${part.text}`);
            stepResults += part.text;
          }
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
  if (process.env.CI)
    if ((await getOverallTestStatus(stepResults)) !== "PASS") process.exit(1);
}

const getOverallTestStatus = async (stepResults: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction:
        "As a software quality analyst, navigate through the test results. If all the tests passes, return PASS. If any of the test fails, return FAIL",
      responseMimeType: "text/x.enum",
      responseSchema: {
        type: Type.STRING,
        enum: ["PASS", "FAIL"],
      },
    },
    contents: stepResults,
  });
  return response.text;
};

main();
