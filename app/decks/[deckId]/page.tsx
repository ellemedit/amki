import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeck } from '@/features/decks/queries'
import { getCardsWithProgress } from '@/features/cards/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Play, Trash2 } from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { deleteDeckById } from '@/features/decks/mutations'
import { deleteCardById } from '@/features/cards/mutations'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/markdown'

interface Props {
  params: Promise<{ deckId: string }>
}

// ---------------------------------------------------------------------------
// Lookup: progress badge config
// ---------------------------------------------------------------------------

const progressConfig: Record<string, { className: string; label: string }> = {
  new: { className: 'border-blue-500/25 text-blue-400', label: '새 카드' },
  learning: {
    className: 'border-amber-500/25 text-amber-400',
    label: '학습 중',
  },
  mastered: {
    className: 'border-emerald-500/25 text-emerald-400',
    label: '복습',
  },
}

function getProgressBadgeProps(status: string) {
  return progressConfig[status] ?? progressConfig.mastered
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBadge({ status }: { status: string }) {
  const { className, label } = getProgressBadgeProps(status)
  return (
    <Badge
      variant="outline"
      className={cn('h-[22px] px-1.5 text-[10px]', className)}
    >
      {label}
    </Badge>
  )
}

function DeleteCardButton({
  cardId,
  deckId,
}: {
  cardId: string
  deckId: string
}) {
  return (
    <form
      action={async () => {
        'use server'
        await deleteCardById(cardId)
        updateTag(`cards-${deckId}`)
        updateTag('decks')
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground/0 group-hover:text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </form>
  )
}

function CardListItem({
  card,
  deckId,
}: {
  card: Awaited<ReturnType<typeof getCardsWithProgress>>[number]
  deckId: string
}) {
  return (
    <div className="group flex items-start gap-4 rounded-xl border border-transparent bg-transparent px-4 py-3.5 transition-colors hover:border-border/50 hover:bg-card/50">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium leading-snug">
          <Markdown>{card.front}</Markdown>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
        <Badge
          variant="outline"
          className="h-[22px] border-border/40 px-1.5 text-[10px] text-muted-foreground"
        >
          {card.type === 'subjective' ? '주관식' : '기본'}
        </Badge>
        {card.progress && <ProgressBadge status={card.progress.status} />}
        <DeleteCardButton cardId={card.id} deckId={deckId} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

export default async function DeckDetailPage({ params }: Props) {
  const { deckId } = await params

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<HeaderSkeleton />}>
        <DeckHeader deckId={deckId} />
      </Suspense>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Suspense fallback={<StatsSkeleton />}>
          <DeckStatsAndActions deckId={deckId} />
        </Suspense>

        <Separator className="mb-8 opacity-50" />

        <Suspense fallback={<CardListSkeleton />}>
          <DeckCardList deckId={deckId} />
        </Suspense>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1) Header
// ---------------------------------------------------------------------------

async function DeckHeader({ deckId }: { deckId: string }) {
  const deck = await getDeck(deckId)
  if (!deck) notFound()

  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{deck.name}</h1>
          {deck.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {deck.description}
            </p>
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
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// 2) Stats + Actions
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

  const stats = [
    { label: '전체', value: total, color: 'text-foreground' },
    { label: '새 카드', value: newCount, color: 'text-blue-400' },
    { label: '학습 중', value: learningCount, color: 'text-amber-400' },
    { label: '복습 대기', value: reviewCount, color: 'text-emerald-400' },
  ]

  return (
    <>
      <div className="mb-6 grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/50 bg-card/50 px-4 py-3.5 text-center"
          >
            <div
              className={cn('text-2xl font-semibold tabular-nums', stat.color)}
            >
              {stat.value}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex gap-2">
        {dueCount > 0 && (
          <Link href={`/decks/${deckId}/study`}>
            <Button size="sm">
              <Play className="mr-1.5 h-3.5 w-3.5" />
              학습 시작 ({dueCount}장)
            </Button>
          </Link>
        )}
        <Link href={`/decks/${deckId}/cards/new`}>
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            카드 추가
          </Button>
        </Link>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// 3) Card list
// ---------------------------------------------------------------------------

async function DeckCardList({ deckId }: { deckId: string }) {
  const cardsWithProgress = await getCardsWithProgress(deckId)

  if (cardsWithProgress.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          아직 카드가 없습니다.
        </p>
        <Link href={`/decks/${deckId}/cards/new`}>
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />첫 카드 추가하기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        카드 목록 ({cardsWithProgress.length})
      </h2>
      {cardsWithProgress.map((card) => (
        <CardListItem key={card.id} card={card} deckId={deckId} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton fallbacks
// ---------------------------------------------------------------------------

function HeaderSkeleton() {
  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>
    </header>
  )
}

function StatsSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 px-4 py-3.5 text-center"
          >
            <Skeleton className="mx-auto mb-1 h-7 w-8" />
            <Skeleton className="mx-auto h-3 w-10" />
          </div>
        ))}
      </div>
      <div className="mb-8 flex gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </>
  )
}

function CardListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl px-4 py-3.5">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
