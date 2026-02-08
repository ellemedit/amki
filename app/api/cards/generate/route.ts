import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const maxDuration = 60;

interface FilePayload {
  name: string;
  mediaType: string;
  url: string; // data URL
}

// ---------------------------------------------------------------------------
// Schema & prompt (shared with chat sub-agent)
// ---------------------------------------------------------------------------

const cardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("카드 앞면 - 질문 또는 프롬프트"),
      back: z.string().describe("카드 뒷면 - 정답 또는 설명"),
      type: z
        .enum(["basic", "subjective"])
        .describe(
          "카드 유형: basic(답을 보고 직접 평가) 또는 subjective(서술형 답안)",
        ),
    }),
  ),
});

const systemPrompt = `당신은 학습 자료에서 효과적인 암기 카드(flashcard)를 생성하는 전문가입니다.

카드 생성 가이드라인:
- 핵심 개념, 정의, 사실, 공식 등을 카드로 만드세요
- 앞면(질문)은 명확하고 구체적으로 작성
- 뒷면(답)은 간결하지만 충분한 정보를 포함
- 하나의 카드에 하나의 개념만 담으세요
- 난이도를 적절히 분배하세요
- 일반적으로 basic 유형을 사용하세요
- 서술형 답변이 필요한 복잡한 개념에는 subjective 유형을 사용하세요
- 5~20장 사이의 카드를 생성하세요`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }
  | { type: "file"; data: string; mediaType: string };

const CHUNK_CHAR_THRESHOLD = 6_000;

/** Split long text content into chunks for parallel processing. */
function splitTextChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  // Split on double-newlines (paragraph boundaries) first
  const paragraphs = text.split(/\n{2,}/);
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

const model = anthropic("claude-haiku-4-5");

async function generateCardsFromContent(content: ContentPart[]) {
  const result = await generateObject({
    model,
    schema: cardSchema,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });
  return result.object.cards;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { files, text } = (await req.json()) as {
    files: FilePayload[];
    text?: string;
  };

  if (!files?.length && !text) {
    return Response.json(
      { error: "파일 또는 텍스트를 제공해주세요." },
      { status: 400 },
    );
  }

  // Separate text content from binary/image content
  const textParts: string[] = [];
  const binaryParts: ContentPart[] = [];

  if (text) textParts.push(text);

  for (const file of files ?? []) {
    const mediaType = file.mediaType;

    if (mediaType.startsWith("image/")) {
      binaryParts.push({ type: "image", image: file.url });
    } else if (
      mediaType === "text/plain" ||
      mediaType === "text/markdown" ||
      mediaType === "text/csv"
    ) {
      const base64Data = file.url.split(",")[1];
      const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
      textParts.push(`--- 파일: ${file.name} ---\n${decoded}\n--- 끝 ---`);
    } else {
      // PDF and other binary files
      binaryParts.push({ type: "file", data: file.url, mediaType });
    }
  }

  try {
    const allText = textParts.join("\n\n");
    const tasks: Promise<z.infer<typeof cardSchema>["cards"]>[] = [];

    if (binaryParts.length > 0) {
      // Binary content (images, PDFs) — single call with all binary parts
      const content: ContentPart[] = [
        {
          type: "text",
          text:
            allText ||
            "이 자료에서 핵심 개념을 파악하고 효과적인 암기 카드를 생성해주세요.",
        },
        ...binaryParts,
      ];
      tasks.push(generateCardsFromContent(content));
    } else if (allText.length > CHUNK_CHAR_THRESHOLD) {
      // Large text — split into chunks and process in parallel
      const chunks = splitTextChunks(allText, CHUNK_CHAR_THRESHOLD);
      for (const chunk of chunks) {
        tasks.push(
          generateCardsFromContent([{ type: "text", text: chunk }]),
        );
      }
    } else {
      // Small text — single call
      tasks.push(
        generateCardsFromContent([
          {
            type: "text",
            text:
              allText ||
              "이 자료에서 핵심 개념을 파악하고 효과적인 암기 카드를 생성해주세요.",
          },
        ]),
      );
    }

    const results = await Promise.all(tasks);
    const cards = results.flat();

    return Response.json({ cards });
  } catch (error) {
    console.error("Card generation error:", error);
    return Response.json(
      { error: "카드 생성 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
