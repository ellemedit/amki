import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { decks, cards, cardProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, Play, Trash2 } from 'lucide-react'
import { deleteDeck } from '@/app/actions/deck-actions'
import { deleteCard } from '@/app/actions/card-actions'

interface Props {
  params: Promise<{ deckId: string }>
}

async function getDeckDetail(deckId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1)

  if (!deck) return null

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.createdAt)

  // Get progress for each card
  const cardsWithProgress = await Promise.all(
    deckCards.map(async (card) => {
      const [progress] = await db
        .select()
        .from(cardProgress)
        .where(eq(cardProgress.cardId, card.id))
        .limit(1)
      return { ...card, progress: progress ?? null }
    }),
  )

  const now = new Date()
  const newCount = cardsWithProgress.filter((c) => !c.progress).length
  const learningCount = cardsWithProgress.filter(
    (c) => c.progress?.status === 'learning',
  ).length
  const reviewCount = cardsWithProgress.filter(
    (c) => c.progress && c.progress.nextReviewDate <= now,
  ).length
  const dueCount = newCount + reviewCount

  return {
    deck,
    cards: cardsWithProgress,
    stats: {
      total: deckCards.length,
      newCount,
      learningCount,
      reviewCount,
      dueCount,
    },
  }
}

export default async function DeckDetailPage({ params }: Props) {
  const { deckId } = await params
  const data = await getDeckDetail(deckId)

  if (!data) notFound()

  const { deck, cards: deckCards, stats } = data

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
            {deck.description && (
              <p className="text-sm text-muted-foreground">
                {deck.description}
              </p>
            )}
          </div>
          <form
            action={async () => {
              'use server'
              await deleteDeck(deckId)
            }}
          >
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">전체 카드</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">
                {stats.newCount}
              </div>
              <p className="text-xs text-muted-foreground">새 카드</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">
                {stats.learningCount}
              </div>
              <p className="text-xs text-muted-foreground">학습 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">
                {stats.reviewCount}
              </div>
              <p className="text-xs text-muted-foreground">복습 대기</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          {stats.dueCount > 0 && (
            <Link href={`/decks/${deckId}/study`}>
              <Button>
                <Play className="mr-2 h-4 w-4" />
                학습 시작 ({stats.dueCount}장)
              </Button>
            </Link>
          )}
          <Link href={`/decks/${deckId}/cards/new`}>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              카드 추가
            </Button>
          </Link>
        </div>

        <Separator className="mb-6" />

        {/* Card list */}
        {deckCards.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">아직 카드가 없습니다.</p>
            <Link href={`/decks/${deckId}/cards/new`}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />첫 카드 추가하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              카드 목록 ({deckCards.length})
            </h2>
            {deckCards.map((card) => (
              <Card key={card.id}>
                <CardContent className="flex items-start justify-between gap-4 pt-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{card.front}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.back}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        card.type === 'subjective' ? 'default' : 'secondary'
                      }
                    >
                      {card.type === 'subjective' ? '주관식' : '기본'}
                    </Badge>
                    {card.progress && (
                      <Badge
                        variant="outline"
                        className={
                          card.progress.status === 'new'
                            ? 'border-blue-500 text-blue-500'
                            : card.progress.status === 'learning'
                              ? 'border-orange-500 text-orange-500'
                              : 'border-green-500 text-green-500'
                        }
                      >
                        {card.progress.status === 'new'
                          ? '새 카드'
                          : card.progress.status === 'learning'
                            ? '학습 중'
                            : '복습'}
                      </Badge>
                    )}
                    <form
                      action={async () => {
                        'use server'
                        await deleteCard(card.id, deckId)
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
