'use client'

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useTransition,
} from 'react'
import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from 'ai'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Paperclip,
  FileText,
  ImageIcon,
  LinkIcon,
  X,
  Check,
  Loader2,
  Sparkles,
  Bot,
  ArrowUp,
  Square,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import { Markdown } from '@/components/markdown'
import { useFileDrop } from '@/shared/hooks/use-file-drop'
import { DragOverlay } from '@/components/drag-overlay'
import { FileChip } from '@/components/file-chip'
import type { FileAttachment } from '@/shared/file'
import { addCards } from '@/app/decks/[deckId]/card-actions-server'
import { toast } from 'sonner'

interface ChatCardCreatorProps {
  deckId: string
  initialMessages?: UIMessage[]
  chatId: string
}

function AiAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
      <Bot className="h-3.5 w-3.5 text-primary" />
    </div>
  )
}

function UserTextBubble({ text }: { text: string }) {
  return (
    <div className="rounded-2xl rounded-br-lg bg-primary px-4 py-2.5 text-[14px] leading-relaxed text-primary-foreground">
      {text}
    </div>
  )
}

function UserImageAttachment({ url }: { url: string }) {
  return <img src={url} alt="첨부 이미지" className="max-h-48 rounded-xl" />
}

function UserFileAttachment() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground">
      <FileText className="h-3.5 w-3.5 shrink-0" />
      첨부 파일
    </div>
  )
}

function UserMessagePart({ part }: { part: UIMessage['parts'][number] }) {
  if (part.type === 'text') return <UserTextBubble text={part.text} />

  if (part.type === 'file') {
    if (part.mediaType?.startsWith('image/')) {
      return <UserImageAttachment url={part.url} />
    }
    return <UserFileAttachment />
  }

  return null
}

interface GeneratedCard {
  front: string
  back: string
  type: string
}

interface CardCandidate extends GeneratedCard {
  _id: string
}

function ReadonlyCardItem({ card }: { card: GeneratedCard }) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/50 px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Badge
          variant="outline"
          className="h-[18px] border-border/40 px-1.5 text-[10px] text-muted-foreground"
        >
          {card.type === 'subjective' ? '주관식' : '기본'}
        </Badge>
      </div>
      <div className="text-[13px] font-medium leading-snug">
        <Markdown>{card.front}</Markdown>
      </div>
      <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        <Markdown>{card.back}</Markdown>
      </div>
    </div>
  )
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function EditableCardItem({
  card,
  onUpdate,
  onRemove,
}: {
  card: CardCandidate
  onUpdate: (field: 'front' | 'back', value: string) => void
  onRemove: () => void
}) {
  return (
    <div className="group relative rounded-lg border border-border/30 bg-background/50 px-3.5 py-3 transition-colors hover:border-border/50">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="h-[18px] border-border/40 px-1.5 text-[10px] text-muted-foreground"
        >
          {card.type === 'subjective' ? '주관식' : '기본'}
        </Badge>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:text-destructive!"
          aria-label="카드 제거"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <textarea
        value={card.front}
        onChange={(e) => onUpdate('front', e.target.value)}
        onInput={(e) => autoResize(e.currentTarget)}
        ref={(el) => {
          if (el) autoResize(el)
        }}
        className="mb-1 w-full resize-none bg-transparent text-[13px] font-medium leading-snug outline-none placeholder:text-muted-foreground/40 focus:rounded focus:bg-muted/30 focus:px-2 focus:py-1"
        rows={1}
        placeholder="앞면 (질문)"
      />
      <textarea
        value={card.back}
        onChange={(e) => onUpdate('back', e.target.value)}
        onInput={(e) => autoResize(e.currentTarget)}
        ref={(el) => {
          if (el) autoResize(el)
        }}
        className="w-full resize-none bg-transparent text-xs leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:rounded focus:bg-muted/30 focus:px-2 focus:py-1"
        rows={1}
        placeholder="뒷면 (답변)"
      />
    </div>
  )
}

function CardCandidateList({
  toolCallId,
  initialCards,
  deckId,
  onSave,
}: {
  toolCallId: string
  initialCards: GeneratedCard[]
  deckId: string
  onSave: (toolCallId: string, count: number) => void
}) {
  const [cards, setCards] = useState<CardCandidate[]>(() =>
    initialCards.map((c, i) => ({ ...c, _id: `${toolCallId}-${i}` })),
  )
  const [saving, startSaving] = useTransition()

  function updateCard(id: string, field: 'front' | 'back', value: string) {
    setCards((prev) =>
      prev.map((c) => (c._id === id ? { ...c, [field]: value } : c)),
    )
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c._id !== id))
  }

  function handleSave() {
    const toSave = cards.filter((c) => c.front.trim() && c.back.trim())
    if (toSave.length === 0) return

    startSaving(async () => {
      const result = await addCards(
        deckId,
        toSave.map(({ front, back, type }) => ({ front, back, type })),
      )
      if ('error' in result) {
        toast.error(result.error)
      } else {
        onSave(toolCallId, result.count)
      }
    })
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">
        모든 카드 후보가 제거되었습니다
      </div>
    )
  }

  const validCount = cards.filter((c) => c.front.trim() && c.back.trim()).length

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/3 px-4 py-3.5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <span className="text-xs font-medium text-primary">
          {cards.length}장의 카드 후보
        </span>
      </div>

      <div className="space-y-2">
        {cards.map((card) => (
          <EditableCardItem
            key={card._id}
            card={card}
            onUpdate={(field, value) => updateCard(card._id, field, value)}
            onRemove={() => removeCard(card._id)}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || validCount === 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              추가 중...
            </>
          ) : (
            `${validCount}장 추가하기`
          )}
        </button>
      </div>
    </div>
  )
}

function GenerateCardsResult({
  part,
  deckId,
  isSaved,
  savedCount,
  onSave,
}: {
  part: {
    toolCallId?: string
    state: string
    input?: unknown
    output?: unknown
  }
  deckId: string
  isSaved: boolean
  savedCount: number
  onSave: (toolCallId: string, count: number) => void
}) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border/60 px-4 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        카드 생성 중...
      </div>
    )
  }

  if (part.state === 'output-error') {
    return (
      <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-xs text-destructive">
        카드 생성 중 오류가 발생했습니다
      </div>
    )
  }

  if (part.state !== 'output-available' || !part.output) return null

  const { cards } = part.output as { cards: GeneratedCard[]; count: number }

  if (isSaved) {
    return (
      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/3 px-4 py-3.5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500/15">
            <Check className="h-3 w-3 text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-emerald-400">
            {savedCount}장의 카드 추가됨
          </span>
        </div>
        <div className="space-y-2">
          {cards.map((card, i) => (
            <ReadonlyCardItem key={i} card={card} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <CardCandidateList
      toolCallId={part.toolCallId ?? ''}
      initialCards={cards}
      deckId={deckId}
      onSave={onSave}
    />
  )
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-2">
        {message.parts.map((part, i) => (
          <UserMessagePart key={i} part={part} />
        ))}
      </div>
    </div>
  )
}

function AssistantMessage({
  message,
  deckId,
  savedCounts,
  onSave,
}: {
  message: UIMessage
  deckId: string
  savedCounts: Map<string, number>
  onSave: (toolCallId: string, count: number) => void
}) {
  const textParts = message.parts.filter((p) => p.type === 'text')
  const toolParts = message.parts.filter((p) => p.type === 'tool-generateCards')

  return (
    <div className="flex items-start gap-3">
      <AiAvatar />
      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
        {textParts.map((part, i) => {
          if (part.type !== 'text') return null
          return (
            <div key={i} className="text-[14px] leading-[1.7]">
              <Markdown>{part.text}</Markdown>
            </div>
          )
        })}

        {toolParts.length > 0 && (
          <div className="space-y-2">
            {toolParts.map((part, i) => {
              const p = part as {
                toolCallId?: string
                state: string
                input?: unknown
                output?: unknown
              }
              const toolCallId = p.toolCallId ?? `${message.id}-${i}`
              return (
                <GenerateCardsResult
                  key={toolCallId}
                  part={p}
                  deckId={deckId}
                  isSaved={savedCounts.has(toolCallId)}
                  savedCount={savedCounts.get(toolCallId) ?? 0}
                  onSave={onSave}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageRow({
  message,
  deckId,
  savedCounts,
  onSave,
}: {
  message: UIMessage
  deckId: string
  savedCounts: Map<string, number>
  onSave: (toolCallId: string, count: number) => void
}) {
  if (message.role === 'user') return <UserMessage message={message} />
  return (
    <AssistantMessage
      message={message}
      deckId={deckId}
      savedCounts={savedCounts}
      onSave={onSave}
    />
  )
}

const suggestions = [
  {
    icon: FileText,
    text: '이 텍스트로 카드 만들어줘',
    desc: '텍스트를 붙여넣으면 핵심 개념을 카드로 만들어 드려요',
  },
  {
    icon: ImageIcon,
    text: '이미지에서 카드 추출해줘',
    desc: '교과서, 노트 사진에서 핵심 내용을 카드로 만들어요',
  },
  {
    icon: LinkIcon,
    text: 'JavaScript의 클로저에 대해 카드 만들어줘',
    desc: '주제를 알려주면 핵심 개념 카드를 만들어 드려요',
  },
]

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="mb-2 text-lg font-semibold tracking-tight">
        AI로 카드 만들기
      </h2>
      <p className="mb-10 max-w-xs text-center text-[13px] leading-relaxed text-muted-foreground">
        학습 자료를 올리거나 주제를 알려주면 AI가 암기 카드를 만들어 드립니다
      </p>
      <div className="w-full max-w-sm space-y-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s.text)}
            className="flex w-full items-start gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3.5 text-left transition-all hover:border-border hover:bg-card"
          >
            <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[13px] font-medium">{s.text}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatCardCreator({
  deckId,
  initialMessages,
  chatId,
}: ChatCardCreatorProps) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<FileAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { isDragging, dropHandlers, openFilePicker, FileInput } = useFileDrop({
    onFiles: (newFiles: FileAttachment[]) =>
      setFiles((prev) => [...prev, ...newFiles]),
  })

  const { messages, setMessages, sendMessage, stop, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat/cards',
      // Only send the last message — previous messages are loaded from DB
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: { message: messages[messages.length - 1], id, deckId, chatId },
        }
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // --- Saved cards tracking (persisted in localStorage) ---
  const [savedCounts, setSavedCounts] = useState<Map<string, number>>(() => {
    if (typeof window === 'undefined') return new Map()
    try {
      const stored = localStorage.getItem(`chat-saved:${chatId}`)
      return stored ? new Map(JSON.parse(stored)) : new Map()
    } catch {
      return new Map()
    }
  })

  function handleCardsSaved(toolCallId: string, count: number) {
    toast.success(`${count}장의 카드가 덱에 추가되었습니다`)

    // Reset chat for a fresh start
    setMessages([])
    setSavedCounts(new Map())
    setInput('')
    setFiles([])
    try {
      localStorage.removeItem(`chat-saved:${chatId}`)
    } catch {}
  }

  const addedCount = Array.from(savedCounts.values()).reduce((a, b) => a + b, 0)

  // --- Auto-resize textarea ---
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [input])

  // --- Dynamic placeholder based on status ---
  const placeholder =
    status === 'submitted'
      ? 'AI가 응답을 준비하는 중...'
      : status === 'streaming'
        ? 'AI가 응답하는 중... 메시지를 미리 입력할 수 있어요'
        : '학습카드를 만들 수 있어요'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isLoading) {
      return
    }
    if (!input.trim() && files.length === 0) {
      return
    }

    const parts: Array<
      | { type: 'text'; text: string }
      | { type: 'file'; mediaType: string; url: string }
    > = []

    if (input.trim()) {
      parts.push({ type: 'text', text: input.trim() })
    }

    for (const file of files) {
      parts.push({ type: 'file', mediaType: file.mediaType, url: file.url })
    }

    sendMessage({ parts })
    setInput('')
    setFiles([])
  }

  const canSend = input.trim() || files.length > 0

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      <div className="flex-1 overflow-y-auto" {...dropHandlers}>
        <div className="mx-auto max-w-[640px] space-y-8 px-5 py-8">
          {messages.length === 0 && (
            <EmptyState
              onSuggestionClick={(text) => {
                setInput(text)
                textareaRef.current?.focus()
              }}
            />
          )}

          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              deckId={deckId}
              savedCounts={savedCounts}
              onSave={handleCardsSaved}
            />
          ))}

          {isLoading && messages.at(-1)?.role !== 'assistant' && (
            <div className="flex items-start gap-3">
              <AiAvatar />
              <div className="flex items-center gap-2 pt-1.5 text-[13px] text-muted-foreground">
                {status === 'submitted' ? (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                    </span>
                    <span>응답을 준비하는 중...</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>생각하는 중...</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {isDragging && <DragOverlay icon={Paperclip} />}
      </div>

      <div className="border-t border-border/50 bg-background">
        {addedCount > 0 && (
          <div className="border-b border-border/50 px-5 py-2">
            <div className="mx-auto flex max-w-[640px] items-center gap-2 text-[13px]">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-muted-foreground">
                <span className="font-medium text-emerald-400">
                  {addedCount}장
                </span>
                의 카드가 추가됨
              </span>
            </div>
          </div>
        )}

        <form className="px-5 py-4" onSubmit={handleSubmit}>
          <div className="mx-auto max-w-[640px]">
            {files.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {files.map((file, i) => (
                  <FileChip
                    key={i}
                    file={file}
                    onRemove={() => removeFile(i)}
                  />
                ))}
              </div>
            )}

            <div
              className={cn(
                'relative flex items-end gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm transition-colors focus-within:border-primary/30 focus-within:shadow-primary/5',
                isLoading ? 'border-border/40' : 'border-border/60',
              )}
            >
              <FileInput />
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                onClick={openFilePicker}
                disabled={isLoading}
                aria-label="파일 첨부"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  'min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 px-1 py-1.5 text-[14px] leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0',
                  isLoading && 'text-muted-foreground',
                )}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                rows={1}
              />
              {isLoading ? (
                <button
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-all hover:bg-destructive/20"
                  onClick={() => stop()}
                  aria-label="중단"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                    canSend
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground/40',
                  )}
                  disabled={!canSend}
                  aria-label="전송"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
