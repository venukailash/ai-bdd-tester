import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { fileURLToPath } from "url";
import * as fs from "fs";
import path from "path";
import "dotenv/config";

export const getAllFeatures = (): string => {
  const __dirname = fileURLToPath(import.meta.url);
  const featureFolder = path.join(__dirname, "../features");
  const features = fs.readdirSync(featureFolder);
  let allFeatures = "";
  console.log(`Starting test for ${features.length} features`);

  for (const featureFile of features) {
    const filePath = path.join(featureFolder, featureFile);

    if (fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, "utf8");
      allFeatures += content + "\n";
    }
  }
  return allFeatures;
};

export const getPlaywrightClient = () => {
  const defaultArgs = ["-y", "@playwright/mcp@latest"];
   defaultArgs.push("--headless");

  const playwrightParams = new StdioClientTransport({
    command: "npx",
    args: defaultArgs,
  });

  const playwrightClient = new Client({
    name: "playwright-mcp",
    version: "1.0.0",
  });
  return { playwrightClient, playwrightParams };
};
