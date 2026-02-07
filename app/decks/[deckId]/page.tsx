import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeck } from '@/features/decks/queries'
import { getCardsWithProgress } from '@/features/cards/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Play, Trash2 } from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { deleteDeckById } from '@/features/decks/mutations'
import { deleteCardById } from '@/features/cards/mutations'

interface Props {
  params: Promise<{ deckId: string }>
}

// ---------------------------------------------------------------------------
// Page shell — static except for params resolution
// ---------------------------------------------------------------------------

export default async function DeckDetailPage({ params }: Props) {
  const { deckId } = await params

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<HeaderSkeleton />}>
        <DeckHeader deckId={deckId} />
      </Suspense>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <Suspense fallback={<StatsSkeleton />}>
          <DeckStatsAndActions deckId={deckId} />
        </Suspense>

        <Separator className="mb-6" />

        <Suspense fallback={<CardListSkeleton />}>
          <DeckCardList deckId={deckId} />
        </Suspense>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1) Header — getDeck 만 필요
// ---------------------------------------------------------------------------

async function DeckHeader({ deckId }: { deckId: string }) {
  const deck = await getDeck(deckId)
  if (!deck) notFound()

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
          {deck.description && (
            <p className="text-sm text-muted-foreground">{deck.description}</p>
          )}
        </div>
        <form
          action={async () => {
            'use server'
            await deleteDeckById(deckId)
            updateTag('decks')
            updateTag(`deck-${deckId}`)
            updateTag(`cards-${deckId}`)
            redirect('/')
          }}
        >
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// 2) Stats + Actions — getCardsWithProgress 로 통계 계산
// ---------------------------------------------------------------------------

async function DeckStatsAndActions({ deckId }: { deckId: string }) {
  const cardsWithProgress = await getCardsWithProgress(deckId)

  const now = new Date()
  const total = cardsWithProgress.length
  const newCount = cardsWithProgress.filter((c) => !c.progress).length
  const learningCount = cardsWithProgress.filter(
    (c) => c.progress?.status === 'learning',
  ).length
  const reviewCount = cardsWithProgress.filter(
    (c) => c.progress && c.progress.nextReviewDate <= now,
  ).length
  const dueCount = newCount + reviewCount

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">전체 카드</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{newCount}</div>
            <p className="text-xs text-muted-foreground">새 카드</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500">
              {learningCount}
            </div>
            <p className="text-xs text-muted-foreground">학습 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">
              {reviewCount}
            </div>
            <p className="text-xs text-muted-foreground">복습 대기</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex gap-3">
        {dueCount > 0 && (
          <Link href={`/decks/${deckId}/study`}>
            <Button>
              <Play className="mr-2 h-4 w-4" />
              학습 시작 ({dueCount}장)
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
    </>
  )
}

// ---------------------------------------------------------------------------
// 3) Card list — getCardsWithProgress (React.cache로 재요청 없음)
// ---------------------------------------------------------------------------

async function DeckCardList({ deckId }: { deckId: string }) {
  const cardsWithProgress = await getCardsWithProgress(deckId)

  if (cardsWithProgress.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">아직 카드가 없습니다.</p>
        <Link href={`/decks/${deckId}/cards/new`}>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />첫 카드 추가하기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        카드 목록 ({cardsWithProgress.length})
      </h2>
      {cardsWithProgress.map((card) => (
        <Card key={card.id}>
          <CardContent className="flex items-start justify-between gap-4 pt-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{card.front}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.back}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={card.type === 'subjective' ? 'default' : 'secondary'}
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
                  await deleteCardById(card.id)
                  updateTag(`cards-${deckId}`)
                  updateTag('decks')
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
  )
}

// ---------------------------------------------------------------------------
// Skeleton fallbacks
// ---------------------------------------------------------------------------

function HeaderSkeleton() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </header>
  )
}

function StatsSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>
    </>
  )
}

function CardListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
