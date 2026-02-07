'use client'

import { useReducer, useTransition } from 'react'
import Link from 'next/link'
import { submitReview, type StudyCard } from '@/app/actions/study-actions'
import { gradeSubjectiveAnswer } from '@/app/actions/ai-actions'
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
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react'
import type { Deck } from '@/db/schema'

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

export function StudySession({ deck, initialCards }: Props) {
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <CardTitle>복습할 카드가 없습니다</CardTitle>
            <CardDescription>
              모든 카드를 복습했거나 아직 카드가 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href={`/decks/${deck.id}`}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                덱으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <CardTitle>학습 완료!</CardTitle>
            <CardDescription>
              {completedCount}장의 카드를 복습했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Link href={`/decks/${deck.id}`}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                덱으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href={`/decks/${deck.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">{deck.name}</h1>
            <p className="text-sm text-muted-foreground">
              {completedCount} / {cards.length}
            </p>
          </div>
          <Badge variant="outline">
            {currentCard.type === 'subjective' ? '주관식' : '기본'}
          </Badge>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-2">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardDescription>질문</CardDescription>
            <CardTitle className="text-xl leading-relaxed whitespace-pre-wrap">
              {currentCard.front}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Subjective answer input */}
        {currentCard.type === 'subjective' && phase === 'question' && (
          <div className="mb-6 space-y-3">
            <Textarea
              value={userAnswer}
              onChange={(e) =>
                dispatch({ kind: 'SET_USER_ANSWER', value: e.target.value })
              }
              placeholder="답을 입력하세요..."
              rows={4}
              autoFocus
            />
            <Button
              onClick={handleGradeSubjective}
              disabled={!userAnswer.trim() || isPending}
              className="w-full"
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
            className="mb-6 w-full"
            size="lg"
          >
            답 보기
          </Button>
        )}

        {/* Grading spinner */}
        {phase === 'grading' && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <RotateCcw className="h-5 w-5 animate-spin" />
                <span>AI가 답안을 채점하고 있습니다...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer */}
        {phase === 'answer' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardDescription>정답</CardDescription>
                <CardTitle className="text-xl leading-relaxed whitespace-pre-wrap">
                  {currentCard.back}
                </CardTitle>
              </CardHeader>

              {/* AI feedback for subjective */}
              {aiFeedback && (
                <CardContent>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium">AI 채점 결과</span>
                      <Badge variant="secondary">
                        {getQualityLabel(aiFeedback.quality)} (
                        {aiFeedback.quality}/5)
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiFeedback.feedback}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Quality rating buttons */}
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                얼마나 잘 알고 있었나요?
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[0, 1, 2, 3, 4, 5].map((q) => (
                  <Button
                    key={q}
                    variant={q >= 3 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQualityRate(q)}
                    disabled={isPending}
                    className={
                      q >= 4
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : q === 3
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : q <= 1
                            ? 'border-destructive text-destructive'
                            : ''
                    }
                  >
                    <span className="text-xs">
                      {q}
                      <br />
                      {getQualityLabel(q)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
