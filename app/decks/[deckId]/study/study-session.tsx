'use client'

import { useReducer, useTransition } from 'react'
import { submitReview, gradeSubjectiveAnswer } from './actions'
import { type StudyCard } from '@/features/study/queries'
import { getQualityLabel } from '@/lib/sm2'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Deck } from '@/features/decks/schema'
import { Markdown } from '@/components/markdown'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types & Reducer
// ---------------------------------------------------------------------------

interface Props {
  deck: Deck
  initialCards: StudyCard[]
}

type Phase = 'question' | 'answer' | 'grading'

type State = {
  cards: StudyCard[]
  currentIndex: number
  phase: Phase
  userAnswer: string
  aiFeedback: { quality: number; feedback: string } | null
  completedCount: number
}

type Action =
  | { kind: 'SHOW_ANSWER' }
  | { kind: 'START_GRADING' }
  | { kind: 'SET_FEEDBACK'; feedback: { quality: number; feedback: string } }
  | { kind: 'SET_USER_ANSWER'; value: string }
  | { kind: 'NEXT_CARD' }

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case 'SHOW_ANSWER':
      return { ...state, phase: 'answer' }
    case 'START_GRADING':
      return { ...state, phase: 'grading' }
    case 'SET_FEEDBACK':
      return { ...state, aiFeedback: action.feedback, phase: 'answer' }
    case 'SET_USER_ANSWER':
      return { ...state, userAnswer: action.value }
    case 'NEXT_CARD':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        completedCount: state.completedCount + 1,
        phase: 'question',
        userAnswer: '',
        aiFeedback: null,
      }
  }
}

// ---------------------------------------------------------------------------
// Lookup: quality button styles
// ---------------------------------------------------------------------------

const qualityStyles: Record<number, string> = {
  0: 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10',
  1: 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10',
  2: 'border-border/60 bg-card text-muted-foreground hover:bg-muted',
  3: 'border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15',
  4: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
  5: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AIFeedbackDisplay({
  feedback,
}: {
  feedback: { quality: number; feedback: string }
}) {
  return (
    <div className="mt-5 rounded-xl border border-primary/15 bg-primary/4 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">AI 채점 결과</span>
        <Badge variant="secondary" className="text-xs">
          {getQualityLabel(feedback.quality)} ({feedback.quality}/5)
        </Badge>
      </div>
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
        {feedback.feedback}
      </p>
    </div>
  )
}

function QualityRatingGrid({
  onRate,
  disabled,
}: {
  onRate: (quality: number) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-center text-[13px] text-muted-foreground">
        얼마나 잘 알고 있었나요?
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((q) => (
          <button
            key={q}
            onClick={() => onRate(q)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3 text-center transition-all',
              'hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
              qualityStyles[q],
            )}
          >
            <span className="text-lg font-semibold">{q}</span>
            <span className="text-[10px]">{getQualityLabel(q)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function StudySession({ deck, initialCards }: Props) {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, {
    cards: initialCards,
    currentIndex: 0,
    phase: 'question',
    userAnswer: '',
    aiFeedback: null,
    completedCount: 0,
  })
  const [isPending, startTransition] = useTransition()

  const { cards, currentIndex, phase, userAnswer, aiFeedback, completedCount } =
    state
  const currentCard = cards[currentIndex]
  const isFinished = currentIndex >= cards.length
  const progressPercent =
    cards.length > 0 ? (completedCount / cards.length) * 100 : 0

  function handleGradeSubjective() {
    if (!currentCard || !userAnswer.trim()) return
    dispatch({ kind: 'START_GRADING' })

    startTransition(async () => {
      const result = await gradeSubjectiveAnswer(
        currentCard.front,
        currentCard.back,
        userAnswer,
      )
      dispatch({ kind: 'SET_FEEDBACK', feedback: result })
    })
  }

  function handleQualityRate(quality: number) {
    if (!currentCard) return

    startTransition(async () => {
      await submitReview(
        currentCard.id,
        deck.id,
        quality,
        currentCard.type === 'subjective' ? userAnswer : undefined,
        aiFeedback?.feedback,
      )
      dispatch({ kind: 'NEXT_CARD' })
    })
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <Card className="mx-auto max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>복습할 카드가 없습니다</CardTitle>
            <CardDescription>
              모든 카드를 복습했거나 아직 카드가 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              덱으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold tracking-tight">
            학습 완료
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            {completedCount}장의 카드를 복습했습니다
          </p>
          <Button onClick={() => router.back()} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            덱으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight">
              {deck.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {completedCount} / {cards.length}
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-border/60 text-xs text-muted-foreground"
          >
            {currentCard.type === 'subjective' ? '주관식' : '기본'}
          </Badge>
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-3">
          <Progress value={progressPercent} className="h-1" />
        </div>
      </header>

      <main className="mx-auto max-w-[600px] px-5 py-10">
        {/* Question */}
        <div className="mb-8 rounded-2xl border border-border/60 bg-card px-6 py-5 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            질문
          </p>
          <div className="text-[17px] font-medium leading-relaxed">
            <Markdown>{currentCard.front}</Markdown>
          </div>
        </div>

        {/* Subjective answer input */}
        {currentCard.type === 'subjective' && phase === 'question' && (
          <div className="mb-8 space-y-3">
            <Textarea
              value={userAnswer}
              onChange={(e) =>
                dispatch({ kind: 'SET_USER_ANSWER', value: e.target.value })
              }
              placeholder="답을 입력하세요..."
              rows={4}
              className="text-[14px]"
              autoFocus
            />
            <Button
              onClick={handleGradeSubjective}
              disabled={!userAnswer.trim() || isPending}
              className="w-full"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isPending ? 'AI 채점 중...' : 'AI 채점 받기'}
            </Button>
          </div>
        )}

        {/* Show answer button for basic cards */}
        {currentCard.type === 'basic' && phase === 'question' && (
          <Button
            onClick={() => dispatch({ kind: 'SHOW_ANSWER' })}
            className="mb-8 w-full"
            size="lg"
          >
            답 보기
          </Button>
        )}

        {/* Grading spinner */}
        {phase === 'grading' && (
          <div className="mb-8 flex items-center justify-center rounded-2xl border border-dashed border-border/60 py-10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 animate-spin" />
              <span>AI가 답안을 채점하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* Answer */}
        {phase === 'answer' && (
          <>
            <div className="mb-8 rounded-2xl border border-border/60 bg-card px-6 py-5 shadow-sm">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                정답
              </p>
              <div className="text-[15px] leading-[1.8]">
                <Markdown>{currentCard.back}</Markdown>
              </div>

              {aiFeedback && <AIFeedbackDisplay feedback={aiFeedback} />}
            </div>

            <QualityRatingGrid
              onRate={handleQualityRate}
              disabled={isPending}
            />
          </>
        )}
      </main>
    </div>
  )
}
