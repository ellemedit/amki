import Link from 'next/link'
import { db } from '@/db'
import { decks, cards, cardProgress } from '@/db/schema'
import { eq, lte, and, count } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen } from 'lucide-react'

async function getDecksWithStats() {
  const allDecks = await db.select().from(decks).orderBy(decks.createdAt)

  const stats = await Promise.all(
    allDecks.map(async (deck) => {
      const [cardCount] = await db
        .select({ count: count() })
        .from(cards)
        .where(eq(cards.deckId, deck.id))

      const [dueCount] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(
          and(
            eq(cards.deckId, deck.id),
            lte(cardProgress.nextReviewDate, new Date()),
          ),
        )

      // Count new cards (no progress record yet)
      const [withProgress] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(eq(cards.deckId, deck.id))

      const newCards = (cardCount?.count ?? 0) - (withProgress?.count ?? 0)

      return {
        ...deck,
        totalCards: cardCount?.count ?? 0,
        dueCards: (dueCount?.count ?? 0) + newCards,
        newCards,
      }
    }),
  )

  return stats
}

export default async function HomePage() {
  const decksWithStats = await getDecksWithStats()

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
        {decksWithStats.length === 0 ? (
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
        ) : (
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
                        <Badge variant="default">
                          {deck.dueCards}장 복습 대기
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
