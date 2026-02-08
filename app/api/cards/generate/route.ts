import { generateText, Output } from "ai";
import { z } from "zod";
import {
  HAIKU_MODEL,
  cardSchema,
  CARD_GENERATION_PROMPT,
} from "@/features/cards/ai-config";

export const maxDuration = 60;

interface FilePayload {
  name: string;
  mediaType: string;
  url: string; // data URL
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }
  | { type: "file"; data: string; mediaType: string };

const CHUNK_CHAR_THRESHOLD = 6_000;

/**
 * 긴 텍스트를 단락(paragraph) 경계 기준으로 분할합니다.
 * 각 청크를 독립적으로 generateObject에 전달하여 병렬 처리합니다.
 */
function splitTextChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
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

async function generateCardsFromContent(content: ContentPart[]) {
  const result = await generateText({
    model: HAIKU_MODEL,
    output: Output.object({ schema: cardSchema }),
    system: CARD_GENERATION_PROMPT,
    messages: [{ role: "user", content }],
  });
  return result.output!.cards;
}

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
      binaryParts.push({ type: "file", data: file.url, mediaType });
    }
  }

  try {
    const allText = textParts.join("\n\n");
    const tasks: Promise<z.infer<typeof cardSchema>["cards"]>[] = [];

    if (binaryParts.length > 0) {
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
      const chunks = splitTextChunks(allText, CHUNK_CHAR_THRESHOLD);
      for (const chunk of chunks) {
        tasks.push(
          generateCardsFromContent([{ type: "text", text: chunk }]),
        );
      }
    } else {
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
