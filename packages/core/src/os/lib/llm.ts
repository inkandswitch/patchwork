import OpenAI from "openai";
import { OPENAI_API_KEY } from "../secrets";

export const isLLMActive = OPENAI_API_KEY !== undefined;

export const openaiClient = isLLMActive
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  : undefined;

export const DEFAULT_MODEL = "gpt-4o";

export const getStringCompletion = async (message) => {
  const response = await openaiClient.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });
  return response.choices[0].message.content;
};
