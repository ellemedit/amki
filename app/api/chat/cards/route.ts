import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
  validateUIMessages,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { insertCard } from "@/features/cards/mutations";
import { revalidateCardsCache } from "@/features/cards/queries";
import { revalidateDecksCache } from "@/features/decks/queries";
import { upsertChatSession } from "@/features/chat/mutations";
import { getChatSession } from "@/features/chat/queries";

export const maxDuration = 60;

function createTools(deckId: string) {
  return {
    cardAdd: tool({
      description:
        "덱에 새로운 암기 카드를 추가합니다. 앞면에는 질문을, 뒷면에는 답을 넣습니다.",
      inputSchema: z.object({
        front: z
          .string()
          .describe("카드 앞면 - 질문 또는 암기할 내용의 프롬프트"),
        back: z.string().describe("카드 뒷면 - 정답 또는 암기할 내용의 설명"),
        type: z
          .enum(["basic", "subjective"])
          .default("basic")
          .describe(
            "카드 유형: basic(답을 보고 직접 평가) 또는 subjective(AI가 답안 채점)",
          ),
      }),
      execute: async ({ front, back, type }) => {
        await insertCard({ deckId, front, back, type });
        revalidateCardsCache(deckId);
        revalidateDecksCache();
        return { success: true, front, back, type };
      },
    }),
  };
}

export async function POST(req: Request) {
  const {
    message,
    deckId,
    chatId,
  }: { message: UIMessage; deckId: string; chatId: string } =
    await req.json();

  const tools = createTools(deckId);

  // Load previous messages from DB instead of receiving all from client
  const session = await getChatSession(chatId);
  const previousMessages = (session?.messages as UIMessage[]) ?? [];

  // Validate messages (tools may have changed between deploys)
  const messages = await validateUIMessages({
    messages: [...previousMessages, message],
    tools: tools as Parameters<typeof validateUIMessages>[0]["tools"],
  });

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `당신은 암기 카드(flashcard) 제작을 도와주는 AI 어시스턴트입니다.

사용자가 텍스트, 이미지, PDF, 링크 등의 학습 자료를 제공하면:
1. 핵심 개념을 파악하세요
2. 효과적인 암기 카드를 만들어 제안하세요
3. cardAdd 도구를 사용하여 카드를 추가하세요

카드 작성 가이드라인:
- 앞면(질문)은 명확하고 구체적으로
- 뒷면(답)은 간결하지만 충분한 정보를 포함
- 하나의 카드에 하나의 개념만 담으세요
- 사용자가 원하면 주관식(subjective) 유형으로도 만들 수 있습니다
- 여러 카드를 한 번에 추가할 때는 각 카드마다 개별적으로 cardAdd를 호출하세요

사용자가 "카드 만들어줘", "이 내용으로 카드 추가해줘" 등의 요청을 하면 적극적으로 카드를 생성하세요.
카드를 추가한 후에는 어떤 카드를 만들었는지 요약해서 알려주세요.`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
  });

  // Consume stream so onFinish fires even if client disconnects
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // Server-side message ID generation for persistence consistency
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    onFinish: async ({ messages: finalMessages }) => {
      await upsertChatSession(chatId, deckId, finalMessages);
    },
    onError: (error) => {
      if (error instanceof Error) return error.message;
      return String(error);
    },
  });
}
