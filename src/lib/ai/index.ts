import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";
import { db } from "@/lib/db";

async function getUserApiKey(userId: string, provider: string): Promise<string | null> {
  const key = await db.apiKey.findFirst({
    where: { userId, provider },
  });
  return key?.key || null;
}

function getOpenAI(apiKey?: string) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return createOpenAI({ apiKey: key });
}

function getAnthropic(apiKey?: string) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return createAnthropic({ apiKey: key });
}

async function getModel(userId?: string, provider?: string) {
  if (provider === "anthropic") {
    const userKey = userId ? await getUserApiKey(userId, "anthropic") : null;
    const anthropic = getAnthropic(userKey || undefined);
    return anthropic ? anthropic("claude-3-5-sonnet-latest") : null;
  }
  const userKey = userId ? await getUserApiKey(userId, "openai") : null;
  const openai = getOpenAI(userKey || undefined);
  return openai ? openai("gpt-4o-mini") : null;
}

async function checkQuota(userId: string): Promise<boolean> {
  const usage = await db.aiUsage.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
  return usage < 1000;
}

async function trackUsage(
  userId: string,
  workspaceId: string | undefined,
  provider: string,
  model: string,
  tokens: number,
  feature: string
) {
  await db.aiUsage.create({
    data: { userId, workspaceId: workspaceId || null, provider, model, tokens, feature },
  });
}

export async function aiSummarize(
  userId: string,
  workspaceId: string,
  content: string
): Promise<string> {
  const model = await getModel(userId);
  if (!model) throw new Error("No AI provider configured");

  const quotaOk = await checkQuota(userId);
  if (!quotaOk) throw new Error("AI quota exceeded this month");

  const result = await generateText({
    model,
    system: "You are a helpful assistant. Summarize the following document concisely in 2-3 sentences.",
    prompt: content.slice(0, 8000),
  });

  await trackUsage(
    userId,
    workspaceId,
    "openai",
    "gpt-4o-mini",
    result.usage?.totalTokens || 0,
    "summarize"
  );

  return result.text;
}

export async function aiRewrite(
  userId: string,
  workspaceId: string,
  content: string,
  instruction: string
): Promise<string> {
  const model = await getModel(userId);
  if (!model) throw new Error("No AI provider configured");

  const quotaOk = await checkQuota(userId);
  if (!quotaOk) throw new Error("AI quota exceeded this month");

  const result = await generateText({
    model,
    system: `You are a writing assistant. ${instruction}. Return ONLY the rewritten text, no explanations.`,
    prompt: content,
  });

  await trackUsage(
    userId,
    workspaceId,
    "openai",
    "gpt-4o-mini",
    result.usage?.totalTokens || 0,
    "rewrite"
  );

  return result.text;
}

export async function aiGenerate(
  userId: string,
  workspaceId: string,
  prompt: string
): Promise<string> {
  const model = await getModel(userId);
  if (!model) throw new Error("No AI provider configured");

  const quotaOk = await checkQuota(userId);
  if (!quotaOk) throw new Error("AI quota exceeded this month");

  const result = await generateText({
    model,
    prompt,
  });

  await trackUsage(
    userId,
    workspaceId,
    "openai",
    "gpt-4o-mini",
    result.usage?.totalTokens || 0,
    "generate"
  );

  return result.text;
}

export async function aiAnswer(
  userId: string,
  workspaceId: string,
  question: string,
  documentContent: string
): Promise<string> {
  const model = await getModel(userId);
  if (!model) throw new Error("No AI provider configured");

  const quotaOk = await checkQuota(userId);
  if (!quotaOk) throw new Error("AI quota exceeded this month");

  const result = await generateText({
    model,
    system: "You are a helpful assistant. Answer questions about the provided document. Be concise.",
    prompt: `Document:\n${documentContent.slice(0, 8000)}\n\nQuestion: ${question}`,
  });

  await trackUsage(
    userId,
    workspaceId,
    "openai",
    "gpt-4o-mini",
    result.usage?.totalTokens || 0,
    "qa"
  );

  return result.text;
}

export async function aiExtractActionItems(
  userId: string,
  workspaceId: string,
  content: string
): Promise<string> {
  const model = await getModel(userId);
  if (!model) throw new Error("No AI provider configured");

  const quotaOk = await checkQuota(userId);
  if (!quotaOk) throw new Error("AI quota exceeded this month");

  const result = await generateText({
    model,
    system:
      "Extract action items from the following meeting notes or document. List each as a bullet point with a clear owner if mentioned.",
    prompt: content.slice(0, 8000),
  });

  await trackUsage(
    userId,
    workspaceId,
    "openai",
    "gpt-4o-mini",
    result.usage?.totalTokens || 0,
    "action_items"
  );

  return result.text;
}

export async function getUserAiUsage(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return db.aiUsage.findMany({
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
