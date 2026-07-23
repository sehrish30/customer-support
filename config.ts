import "dotenv/config";
import * as ai from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@supabase/supabase-js";
import { wrapAISDK } from "langsmith/experimental/vercel";

const googleApiKey = process.env.GOOGLEa_GENERATIVE_AI_API_KEY;
if (!googleApiKey) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
}

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}

export const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
export const groq = createGroq({ apiKey: groqApiKey });

export const { generateText, streamText } = wrapAISDK(ai);

export function tracedModel(modelId: string) {
  return groq(modelId);
}

if (!process.env.TAVILY_API_KEY) {
  throw new Error("Missing TAVILY_API_KEY environment variable");
}

const supabasePrivateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabasePrivateKey)
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing or invalid");

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL is missing or invalid");

export const supabase = createClient(supabaseUrl, supabasePrivateKey);
