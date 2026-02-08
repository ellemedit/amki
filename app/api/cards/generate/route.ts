import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const maxDuration = 60;

interface FilePayload {
  name: string;
  mediaType: string;
  url: string; // data URL
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

  // Build user message content parts
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string }
    | { type: "file"; data: string; mediaType: string }
  > = [];

  content.push({
    type: "text",
    text:
      text ||
      "이 자료에서 핵심 개념을 파악하고 효과적인 암기 카드를 생성해주세요.",
  });

  for (const file of files ?? []) {
    const mediaType = file.mediaType;

    if (mediaType.startsWith("image/")) {
      content.push({ type: "image", image: file.url });
    } else if (
      mediaType === "text/plain" ||
      mediaType === "text/markdown" ||
      mediaType === "text/csv"
    ) {
      // Decode text files and pass as text for better AI comprehension
      const base64Data = file.url.split(",")[1];
      const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
      content.push({
        type: "text",
        text: `--- 파일: ${file.name} ---\n${decoded}\n--- 끝 ---`,
      });
    } else {
      // PDF and other binary files
      content.push({
        type: "file",
        data: file.url,
        mediaType,
      });
    }
  }

  try {
    const result = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: z.object({
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
      }),
      system: `당신은 학습 자료에서 효과적인 암기 카드(flashcard)를 생성하는 전문가입니다.

카드 생성 가이드라인:
- 핵심 개념, 정의, 사실, 공식 등을 카드로 만드세요
- 앞면(질문)은 명확하고 구체적으로 작성
- 뒷면(답)은 간결하지만 충분한 정보를 포함
- 하나의 카드에 하나의 개념만 담으세요
- 난이도를 적절히 분배하세요
- 일반적으로 basic 유형을 사용하세요
- 서술형 답변이 필요한 복잡한 개념에는 subjective 유형을 사용하세요
- 5~20장 사이의 카드를 생성하세요`,
      messages: [{ role: "user", content }],
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Card generation error:", error);
    return Response.json(
      { error: "카드 생성 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
