export async function gptPrompt(fileName: string, chunk: string): Promise<any> {
  const prompt = {
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You are an expert document analyst with deep knowledge across various domains. Your task is to analyze the given document comprehensively and accurately.",
      },
      {
        role: "user",
        content: `Analyze the following part of the document titled "${fileName}":\n\n${chunk}. Please provide a very concise summary (no more than 2-3 sentences) focusing only on the key points without repetition.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "A very concise summary of the document in 2-3 sentences, focusing only on the key points without repetition.",
            },
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["word", "explanation"],
                additionalProperties: false,
              },
              description:
                "5-7 most important keywords or phrases with explanations",
            },
            categories: {
              type: "array",
              items: { type: "string" },
              description:
                "2-3 main categories that best describe the document content",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description:
                "5-7 related tags for indexing or searching the document",
            },
            keyInsights: {
              type: "array",
              items: { type: "string" },
              description:
                "3-5 key insights or points derived from the document",
            },
            toneAndStyle: {
              type: "string",
              description:
                "A brief description of the document's tone and style",
            },
            targetAudience: {
              type: "string",
              description:
                "Identification of the expected target audience for this document",
            },
            potentialApplications: {
              type: "array",
              items: { type: "string" },
              description:
                "2-3 potential applications or use cases for the information in this document",
            },
          },
          required: [
            "summary",
            "keywords",
            "categories",
            "tags",
            "keyInsights",
            "toneAndStyle",
            "targetAudience",
            "potentialApplications",
          ],
          additionalProperties: false,
        },
      },
    },
  };

  return prompt;
}
