'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { cn } from '@/shared/utils'
import { Markdown } from '@/components/markdown'
import { useFileDrop } from '@/shared/hooks/use-file-drop'
import { DragOverlay } from '@/components/drag-overlay'
import { FileChip } from '@/components/file-chip'
import type { FileAttachment } from '@/shared/file'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatCardCreatorProps {
  deckId: string
  initialMessages?: UIMessage[]
  chatId: string
}

// ---------------------------------------------------------------------------
// Sub-components (leaf-level, no deep nesting)
// ---------------------------------------------------------------------------

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

function CardItem({ card }: { card: GeneratedCard }) {
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

function GenerateCardsResult({
  part,
}: {
  part: { state: string; input?: unknown; output?: unknown }
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

  const { cards, count } = part.output as {
    cards: GeneratedCard[]
    count: number
  }

  return (
    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/3 px-4 py-3.5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-3 w-3 text-emerald-400" />
        </div>
        <span className="text-xs font-medium text-emerald-400">
          {count}장의 카드 추가됨
        </span>
      </div>
      <div className="space-y-2">
        {cards.map((card, i) => (
          <CardItem key={i} card={card} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message rows
// ---------------------------------------------------------------------------

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

function AssistantMessage({ message }: { message: UIMessage }) {
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
            {toolParts.map((part, i) => (
              <GenerateCardsResult key={i} part={part as never} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageRow({ message }: { message: UIMessage }) {
  if (message.role === 'user') return <UserMessage message={message} />
  return <AssistantMessage message={message} />
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
    onFiles: useCallback(
      (newFiles: FileAttachment[]) =>
        setFiles((prev) => [...prev, ...newFiles]),
      [],
    ),
  })

  const { messages, sendMessage, status } = useChat({
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

  const addedCount = messages
    .filter((m) => m.role === 'assistant')
    .flatMap((m) => m.parts)
    .filter(
      (p) =>
        p.type === 'tool-generateCards' &&
        'state' in p &&
        p.state === 'output-available',
    )
    .reduce((sum, p) => {
      const output = (p as { output?: { count?: number } }).output
      return sum + (output?.count ?? 0)
    }, 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!input.trim() && files.length === 0) return

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = input.trim() || files.length > 0

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      {/* Messages */}
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
            <MessageRow key={message.id} message={message} />
          ))}

          {isLoading && messages.at(-1)?.role !== 'assistant' && (
            <div className="flex items-start gap-3">
              <AiAvatar />
              <div className="flex items-center gap-2 pt-1.5 text-[13px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>생각하는 중...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {isDragging && <DragOverlay icon={Paperclip} />}
      </div>

      {/* Footer */}
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

        <div className="px-5 py-4">
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

            <div className="relative flex items-end gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm transition-colors focus-within:border-primary/30 focus-within:shadow-primary/5">
              <FileInput />
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                onKeyDown={handleKeyDown}
                placeholder="학습 자료를 붙여넣거나, 만들고 싶은 카드를 설명하세요..."
                className="min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 px-1 py-1.5 text-[14px] leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
                rows={1}
                disabled={isLoading}
              />
              <button
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                  canSend
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground/40',
                )}
                onClick={handleSubmit}
                disabled={isLoading || !canSend}
                aria-label="전송"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
