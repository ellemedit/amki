'use client'

import { useReducer, useTransition } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createCard } from './actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Check } from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { toast } from 'sonner'

type State = {
  type: 'basic' | 'subjective'
  addedCount: number
}

type Action = { kind: 'SET_TYPE'; type: State['type'] } | { kind: 'CARD_ADDED' }

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case 'SET_TYPE':
      return { ...state, type: action.type }
    case 'CARD_ADDED':
      return { ...state, addedCount: state.addedCount + 1 }
  }
}

const initialState: State = { type: 'basic', addedCount: 0 }

export default function NewCardPage() {
  const params = useParams<{ deckId: string }>()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    formData.set('type', state.type)

    const result = await createCard(params.deckId, formData)

    startTransition(async () => {
      if (result?.error) {
        toast.error(result.error)
        return
      }

      dispatch({ kind: 'CARD_ADDED' })
      toast.success('카드가 추가되었습니다.')
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">카드 추가</h1>
            {state.addedCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {state.addedCount}장 추가됨
              </p>
            )}
          </div>
          <Link href={`/decks/${params.deckId}`}>
            <Button variant="outline">
              <Check className="mr-2 h-4 w-4" />
              완료
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>새 카드</CardTitle>
            <CardDescription>
              앞면에 질문을, 뒷면에 답을 입력하세요. 연속으로 추가할 수
              있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="card-form" action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">카드 유형</Label>
                <Select
                  value={state.type}
                  onValueChange={(v) =>
                    dispatch({ kind: 'SET_TYPE', type: v as State['type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      기본 - 답을 보고 직접 평가
                    </SelectItem>
                    <SelectItem value="subjective">
                      주관식 - AI가 답안 채점
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="front">앞면 (질문)</Label>
                <Textarea
                  id="front"
                  name="front"
                  placeholder="질문 또는 암기할 내용의 앞면"
                  rows={3}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="back">뒷면 (답)</Label>
                <Textarea
                  id="back"
                  name="back"
                  placeholder="정답 또는 암기할 내용의 뒷면"
                  rows={3}
                  required
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {isPending ? '추가 중...' : '카드 추가'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
