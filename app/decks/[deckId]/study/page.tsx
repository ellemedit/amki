import { Suspense } from 'react'
import { connection } from 'next/server'
import { getStudyCards } from '@/features/study/queries'
import { getDeck } from '@/features/decks/queries'
import { notFound } from 'next/navigation'
import { StudySession } from './study-session'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  params: Promise<{ deckId: string }>
}

export default function StudyPage({ params }: Props) {
  return (
    <Suspense fallback={<StudySkeleton />}>
      <StudyContent params={params} />
    </Suspense>
  )
}

// --- Dynamic boundary: study cards are always fresh (not cached) ---

async function StudyContent({
  params,
}: {
  params: Promise<{ deckId: string }>
}) {
  const { deckId } = await params
  // Explicitly opt into request-time rendering for fresh due-date data
  await connection()

  const deck = await getDeck(deckId)
  if (!deck) notFound()

  const studyCards = await getStudyCards(deckId)

  return <StudySession deck={deck} initialCards={studyCards} />
}

function StudySkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-16" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-2">
          <Skeleton className="h-1.5 w-full" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-2 h-4 w-12" />
          <Skeleton className="h-7 w-3/4" />
        </div>
        <Skeleton className="mt-6 h-12 w-full" />
      </main>
    </div>
  )
}
