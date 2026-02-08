import { Suspense } from "react";
import Link from "next/link";
import { getDecksWithCardCounts } from "@/features/decks/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Layers } from "lucide-react";

// --- Static shell (prerendered) ---

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Amki</h1>
              <p className="text-xs text-muted-foreground">
                스마트 간격 반복 학습
              </p>
            </div>
          </div>
          <Link href="/decks/new">
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />새 덱
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Suspense fallback={<DeckListSkeleton />}>
          <DeckList />
        </Suspense>
      </main>
    </div>
  );
}

// --- Cached data boundary ---

async function DeckList() {
  const decks = await getDecksWithCardCounts();

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold tracking-tight">
          아직 덱이 없습니다
        </h2>
        <p className="mb-8 text-sm text-muted-foreground">
          첫 번째 덱을 만들어 학습을 시작하세요.
        </p>
        <Link href="/decks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />새 덱 만들기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {decks.map((deck) => (
        <Link key={deck.id} href={`/decks/${deck.id}`} className="block group">
          <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-5 py-4 transition-all group-hover:border-border group-hover:bg-card">
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-medium tracking-tight">
                {deck.name}
              </h3>
              {deck.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {deck.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {deck.totalCards}장
              </span>
              {deck.dueCount > 0 && (
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20 text-xs border-0">
                  {deck.dueCount}장 대기
                </Badge>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// --- Skeleton fallback ---

function DeckListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border/50 px-5 py-4"
        >
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}
