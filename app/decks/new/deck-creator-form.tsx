'use client'

import { useReducer, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/back-button'
import {
  Upload,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import { createDeckWithCards } from './actions'
import { useFileDrop } from '@/shared/hooks/use-file-drop'
import { DragOverlay } from '@/components/drag-overlay'
import { FileChip } from '@/components/file-chip'
import type { FileAttachment } from '@/shared/file'

interface CardDraft {
  id: string
  front: string
  back: string
  type: 'basic' | 'subjective'
  selected: boolean
}

interface FormState {
  name: string
  description: string
  cards: CardDraft[]
  uploadedFiles: FileAttachment[]
  isGenerating: boolean
  error: string | null
}

type FormAction =
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'SET_ERROR'; value: string | null }
  | { type: 'GENERATE_START' }
  | { type: 'GENERATE_SUCCESS'; files: FileAttachment[]; cards: CardDraft[] }
  | { type: 'GENERATE_FAIL'; error: string }
  | { type: 'REMOVE_FILE'; index: number }
  | { type: 'UPDATE_CARD'; id: string; updates: Partial<CardDraft> }
  | { type: 'TOGGLE_CARD'; id: string }
  | { type: 'DELETE_CARD'; id: string }
  | { type: 'ADD_CARD'; card: CardDraft }
  | { type: 'TOGGLE_ALL' }

const initialState: FormState = {
  name: '',
  description: '',
  cards: [],
  uploadedFiles: [],
  isGenerating: false,
  error: null,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.value }
    case 'SET_DESCRIPTION':
      return { ...state, description: action.value }
    case 'SET_ERROR':
      return { ...state, error: action.value }
    case 'GENERATE_START':
      return { ...state, isGenerating: true, error: null }
    case 'GENERATE_SUCCESS':
      return {
        ...state,
        isGenerating: false,
        uploadedFiles: [...state.uploadedFiles, ...action.files],
        cards: [...state.cards, ...action.cards],
      }
    case 'GENERATE_FAIL':
      return { ...state, isGenerating: false, error: action.error }
    case 'REMOVE_FILE':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.filter((_, i) => i !== action.index),
      }
    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, ...action.updates } : c,
        ),
      }
    case 'TOGGLE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, selected: !c.selected } : c,
        ),
      }
    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.id),
      }
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.card] }
    case 'TOGGLE_ALL': {
      const allSelected =
        state.cards.length > 0 && state.cards.every((c) => c.selected)
      return {
        ...state,
        cards: state.cards.map((c) => ({ ...c, selected: !allSelected })),
      }
    }
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function CardItem({
  card,
  onUpdate,
  onToggle,
  onDelete,
}: {
  card: CardDraft
  onUpdate: (updates: Partial<CardDraft>) => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all',
        card.selected
          ? 'border-primary/20 bg-card shadow-sm'
          : 'border-border/30 bg-card/40 opacity-60',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Selection toggle */}
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0 transition-colors hover:text-primary"
        >
          {card.selected ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/50" />
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              앞면 (질문)
            </label>
            <Textarea
              value={card.front}
              onChange={(e) => onUpdate({ front: e.target.value })}
              className="min-h-[52px] resize-none border-border/40 bg-background/60 text-[13px] leading-relaxed"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              뒷면 (답)
            </label>
            <Textarea
              value={card.back}
              onChange={(e) => onUpdate({ back: e.target.value })}
              className="min-h-[52px] resize-none border-border/40 bg-background/60 text-[13px] leading-relaxed"
              rows={2}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                type: card.type === 'basic' ? 'subjective' : 'basic',
              })
            }
            className={cn(
              'rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors',
              card.type === 'subjective'
                ? 'border-blue-500/20 bg-blue-500/5 text-blue-500'
                : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
            )}
          >
            {card.type === 'subjective' ? '주관식' : '기본'}
          </button>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function DeckCreatorForm() {
  const router = useRouter()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [isPending, startTransition] = useTransition()

  const { name, description, cards, uploadedFiles, isGenerating, error } = state
  const selectedCount = cards.filter((c) => c.selected).length
  const allSelected = cards.length > 0 && cards.every((c) => c.selected)

  const handleFiles = useCallback(async (files: FileAttachment[]) => {
    dispatch({ type: 'GENERATE_START' })

    try {
      const response = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map(({ name, mediaType, url }) => ({
            name,
            mediaType,
            url,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? '카드 생성에 실패했습니다.')
      }

      const data = await response.json()
      const newCards: CardDraft[] = (data.cards ?? []).map(
        (c: { front: string; back: string; type: string }) => ({
          id: generateId(),
          front: c.front,
          back: c.back,
          type: c.type === 'subjective' ? 'subjective' : 'basic',
          selected: true,
        }),
      )

      dispatch({ type: 'GENERATE_SUCCESS', files, cards: newCards })
    } catch (err) {
      dispatch({
        type: 'GENERATE_FAIL',
        error: err instanceof Error ? err.message : '오류가 발생했습니다.',
      })
    }
  }, [])

  const { isDragging, dropHandlers, openFilePicker, FileInput } = useFileDrop({
    onFiles: handleFiles,
  })

  function handleSubmit() {
    if (!name.trim()) {
      dispatch({ type: 'SET_ERROR', value: '덱 이름을 입력해주세요.' })
      return
    }

    dispatch({ type: 'SET_ERROR', value: null })

    const selectedCards = cards
      .filter((c) => c.selected && c.front.trim() && c.back.trim())
      .map(({ front, back, type }) => ({ front, back, type }))

    startTransition(async () => {
      const result = await createDeckWithCards({
        name,
        description,
        cards: selectedCards,
      })
      if (result?.error) {
        dispatch({ type: 'SET_ERROR', value: result.error })
      } else if (result?.deckId) {
        router.replace(`/decks/${result.deckId}`)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background" {...dropHandlers}>
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
          <BackButton />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              새 덱 만들기
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-5 py-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[13px]">
                덱 이름
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) =>
                  dispatch({ type: 'SET_NAME', value: e.target.value })
                }
                placeholder="예: 영어 단어, 한국사, React 개념"
                required
                autoFocus
                className="text-[14px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[13px]">
                설명 (선택)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) =>
                  dispatch({ type: 'SET_DESCRIPTION', value: e.target.value })
                }
                placeholder="이 덱에 대한 간단한 설명"
                rows={3}
                className="text-[14px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[13px]">파일로 카드 생성 (선택)</Label>

            <div
              onClick={() => !isGenerating && openFilePicker()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all',
                isDragging
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/50 bg-card/30 hover:border-border hover:bg-card/50',
                isGenerating && 'pointer-events-none',
              )}
            >
              <FileInput />

              {isGenerating ? (
                <>
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">
                    AI가 카드를 생성하고 있어요...
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    자료를 분석하고 핵심 개념을 추출하는 중입니다
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, 이미지, 텍스트 파일 · AI가 자동으로 카드를 생성합니다
                  </p>
                </>
              )}
            </div>

            {/* Uploaded file chips */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {uploadedFiles.map((file, i) => (
                  <FileChip
                    key={i}
                    file={file}
                    onRemove={() => dispatch({ type: 'REMOVE_FILE', index: i })}
                  />
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {cards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">생성된 카드</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCount}/{cards.length}장 선택
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'TOGGLE_ALL' })}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {allSelected ? '전체 해제' : '전체 선택'}
                </button>
              </div>

              <div className="space-y-3">
                {cards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onUpdate={(updates) =>
                      dispatch({ type: 'UPDATE_CARD', id: card.id, updates })
                    }
                    onToggle={() =>
                      dispatch({ type: 'TOGGLE_CARD', id: card.id })
                    }
                    onDelete={() =>
                      dispatch({ type: 'DELETE_CARD', id: card.id })
                    }
                  />
                ))}
              </div>

              {/* Add card manually */}
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'ADD_CARD',
                    card: {
                      id: generateId(),
                      front: '',
                      back: '',
                      type: 'basic',
                      selected: true,
                    },
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-card/50 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                카드 직접 추가
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending || isGenerating}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : selectedCount > 0 ? (
                `${selectedCount}장의 카드와 함께 덱 만들기`
              ) : (
                '덱 만들기'
              )}
            </Button>
            <Link href="/">
              <Button type="button" variant="ghost">
                취소
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {isDragging && <DragOverlay icon={Upload} />}
    </div>
  )
}
