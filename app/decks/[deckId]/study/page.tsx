import { getStudyCards } from '@/app/actions/study-actions'
import { db } from '@/db'
import { decks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { StudySession } from './study-session'

interface Props {
  params: Promise<{ deckId: string }>
}

export default async function StudyPage({ params }: Props) {
  const { deckId } = await params

  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1)

  if (!deck) notFound()

  const studyCards = await getStudyCards(deckId)

  return <StudySession deck={deck} initialCards={studyCards} />
}
