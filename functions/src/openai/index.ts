import axios from "axios";
import * as functions from "firebase-functions";
import { gptPrompt } from "../prompt";
const API_KEY = functions.config().openai.api_key;
const API_URL = "https://api.openai.com/v1/chat/completions";

interface AnalysisResult {
  summary: string;
  keywords: Array<{ word: string; explanation: string }>;
  categories: string[];
  tags: string[];
  keyInsights: string[];
  toneAndStyle: string;
  targetAudience: string;
  potentialApplications: string[];
}

export async function analyzeTextWithOpenAI(
  text: string,
  fileName: string
): Promise<AnalysisResult> {
  const maxTokens = 8000;
  const chunks = splitTextIntoChunks(text, maxTokens);
  let fullAnalysis: AnalysisResult = {
    summary: "",
    keywords: [],
    categories: [],
    tags: [],
    keyInsights: [],
    toneAndStyle: "",
    targetAudience: "",
    potentialApplications: [],
  };

  for (const chunk of chunks) {
    try {
      const prompt = await gptPrompt(fileName, chunk);
      const response = await axios.post(API_URL, prompt, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      const chunkAnalysis = response.data.choices[0].message.content;
      const parsedChunkAnalysis: AnalysisResult = JSON.parse(chunkAnalysis);

      // 결과 병합
      fullAnalysis.summary = parsedChunkAnalysis.summary;
      fullAnalysis.keywords = [
        ...fullAnalysis.keywords,
        ...parsedChunkAnalysis.keywords,
      ];
      fullAnalysis.categories = [
        ...new Set([
          ...fullAnalysis.categories,
          ...parsedChunkAnalysis.categories,
        ]),
      ];
      fullAnalysis.tags = [
        ...new Set([...fullAnalysis.tags, ...parsedChunkAnalysis.tags]),
      ];
      fullAnalysis.keyInsights = [
        ...fullAnalysis.keyInsights,
        ...parsedChunkAnalysis.keyInsights,
      ];
      fullAnalysis.toneAndStyle += " " + parsedChunkAnalysis.toneAndStyle;
      fullAnalysis.targetAudience += " " + parsedChunkAnalysis.targetAudience;
      fullAnalysis.potentialApplications = [
        ...new Set([
          ...fullAnalysis.potentialApplications,
          ...parsedChunkAnalysis.potentialApplications,
        ]),
      ];
    } catch (error) {
      console.error("Error analyzing document:", error);
    }
  }

  // 결과 정리
  fullAnalysis.summary = fullAnalysis.summary.trim();
  fullAnalysis.keywords = fullAnalysis.keywords.slice(0, 7);
  fullAnalysis.categories = fullAnalysis.categories.slice(0, 3);
  fullAnalysis.tags = fullAnalysis.tags.slice(0, 7);
  fullAnalysis.keyInsights = fullAnalysis.keyInsights.slice(0, 5);
  fullAnalysis.toneAndStyle = fullAnalysis.toneAndStyle.trim();
  fullAnalysis.targetAudience = fullAnalysis.targetAudience.trim();
  fullAnalysis.potentialApplications = fullAnalysis.potentialApplications.slice(
    0,
    3
  );

  return fullAnalysis;
}

function splitTextIntoChunks(text: string, maxTokens: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + word).length > maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += word + " ";
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
