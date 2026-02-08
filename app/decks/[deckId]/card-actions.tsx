'use client'

import { useTransition, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { updateCard, deleteCard } from './actions'

// ---------------------------------------------------------------------------
// Shared form buttons (useFormStatus must be in a child of <form>)
// ---------------------------------------------------------------------------

function FormButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus()
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={pending}
      >
        취소
      </Button>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        저장
      </Button>
    </>
  )
}

// ---------------------------------------------------------------------------
// Edit Card Dialog
// ---------------------------------------------------------------------------

export function EditCardButton({
  deckId,
  cardId,
  front,
  back,
  type,
}: {
  deckId: string
  cardId: string
  front: string
  back: string
  type: string
}) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카드 수정</DialogTitle>
          <DialogDescription>
            카드의 앞면과 뒷면을 수정합니다.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (formData) => {
            const result = await updateCard(deckId, cardId, formData)
            if (!result?.error) {
              startTransition(() => setOpen(false))
            }
          }}
          className="space-y-4"
        >
          <input type="hidden" name="type" value={type} />
          <div className="space-y-2">
            <Label htmlFor={`card-front-${cardId}`}>앞면</Label>
            <Textarea
              id={`card-front-${cardId}`}
              name="front"
              defaultValue={front}
              placeholder="질문 또는 키워드"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`card-back-${cardId}`}>뒷면</Label>
            <Textarea
              id={`card-back-${cardId}`}
              name="back"
              defaultValue={back}
              placeholder="답변 또는 설명"
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <FormButtons onCancel={() => setOpen(false)} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete Card Dialog
// ---------------------------------------------------------------------------

export function DeleteCardButton({
  deckId,
  cardId,
}: {
  deckId: string
  cardId: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/0 group-hover:text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카드 삭제</DialogTitle>
          <DialogDescription>
            이 카드와 학습 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수
            없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteCard(deckId, cardId)
                setOpen(false)
              })
            }}
          >
            {isPending && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
