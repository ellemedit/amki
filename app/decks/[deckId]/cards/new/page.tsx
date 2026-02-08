import { Suspense } from "react";
import { randomUUID } from "crypto";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { getLatestChatSession } from "@/features/chat/queries";
import { ChatCardCreator } from "./chat-card-creator";
import type { UIMessage } from "ai";

interface Props {
  params: Promise<{ deckId: string }>;
}

export default function NewCardPage({ params }: Props) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent params={params} />
    </Suspense>
  );
}

async function ChatContent({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const session = await getLatestChatSession(deckId);

  const chatId = session?.id ?? randomUUID();
  const initialMessages = session
    ? (session.messages as UIMessage[])
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight">
              카드 추가
            </h1>
            <p className="text-xs text-muted-foreground">
              AI와 대화하며 카드를 만들어보세요
            </p>
          </div>
          <Link href={`/decks/${deckId}`}>
            <Button variant="outline" size="sm">
              <Check className="mr-1.5 h-3.5 w-3.5" />
              완료
            </Button>
          </Link>
        </div>
      </header>

      <ChatCardCreator
        deckId={deckId}
        chatId={chatId}
        initialMessages={initialMessages}
      />
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="mb-1.5 h-4 w-16" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </header>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 px-5 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="ml-auto h-10 w-48 rounded-2xl" />
            <Skeleton className="h-24 w-64 rounded-2xl" />
          </div>
        </div>
        <div className="border-t border-border/50 px-5 py-4">
          <div className="mx-auto max-w-3xl">
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
