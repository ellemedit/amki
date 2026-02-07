import { Suspense } from 'react'
import Link from 'next/link'
import { getDecksWithStats } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, BookOpen } from 'lucide-react'

// --- Static shell (prerendered) ---

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Amki</h1>
            <p className="text-sm text-muted-foreground">
              스마트 간격 반복 학습
            </p>
          </div>
          <Link href="/decks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />새 덱 만들기
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <Suspense fallback={<DeckListSkeleton />}>
          <DeckList />
        </Suspense>
      </main>
    </div>
  )
}

// --- Cached data boundary (use cache via getDecksWithStats) ---

async function DeckList() {
  const decksWithStats = await getDecksWithStats()

  if (decksWithStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">아직 덱이 없습니다</h2>
        <p className="mb-6 text-muted-foreground">
          첫 번째 덱을 만들어 학습을 시작하세요.
        </p>
        <Link href="/decks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />새 덱 만들기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decksWithStats.map((deck) => (
        <Link key={deck.id} href={`/decks/${deck.id}`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{deck.name}</CardTitle>
              {deck.description && (
                <CardDescription className="line-clamp-2">
                  {deck.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{deck.totalCards}장</Badge>
                {deck.dueCards > 0 && (
                  <Badge variant="default">{deck.dueCards}장 복습 대기</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// --- Skeleton fallback ---

function DeckListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6">
          <Skeleton className="mb-3 h-6 w-3/4" />
          <Skeleton className="mb-4 h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
