import Link from "next/link";
import { z } from "zod";
import { redirect } from "next/navigation";
import { insertDeck } from "@/features/decks/mutations";
import { updateDecksCache } from "@/features/decks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/back-button";

const deckSchema = z.object({
  name: z.string().trim().min(1, "덱 이름을 입력해주세요."),
  description: z.string().trim().default(""),
});

async function createDeck(formData: FormData) {
  "use server";
  const result = deckSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }
  const deck = await insertDeck(result.data);
  updateDecksCache();
  redirect(`/decks/${deck.id}`);
}

export default function NewDeckPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
          <BackButton />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              새 덱 만들기
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-5 py-10">
        <form action={createDeck} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[13px]">
              덱 이름
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="예: 영어 단어, 한국사, React 개념"
              required
              autoFocus
              className="text-[14px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[13px]">
              설명 (선택)
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="이 덱에 대한 간단한 설명"
              rows={3}
              className="text-[14px]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">덱 만들기</Button>
            <Link href="/">
              <Button type="button" variant="ghost">
                취소
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
