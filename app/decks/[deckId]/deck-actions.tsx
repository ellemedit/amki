'use client'

import { useTransition, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { updateDeck, deleteDeck } from './actions'

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
// Edit Deck Dialog
// ---------------------------------------------------------------------------

export function EditDeckButton({
  deckId,
  name,
  description,
}: {
  deckId: string
  name: string
  description: string
}) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>덱 수정</DialogTitle>
          <DialogDescription>덱 이름과 설명을 수정합니다.</DialogDescription>
        </DialogHeader>

        <form
          action={async (formData) => {
            const result = await updateDeck(deckId, formData)
            if (!result?.error) {
              startTransition(() => setOpen(false))
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="deck-name">이름</Label>
            <Input
              id="deck-name"
              name="name"
              defaultValue={name}
              placeholder="덱 이름"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deck-description">설명</Label>
            <Textarea
              id="deck-description"
              name="description"
              defaultValue={description}
              placeholder="덱에 대한 설명 (선택)"
              rows={3}
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
// Delete Deck Dialog
// ---------------------------------------------------------------------------

export function DeleteDeckButton({ deckId }: { deckId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>덱 삭제</DialogTitle>
          <DialogDescription>
            이 덱과 포함된 모든 카드가 영구적으로 삭제됩니다. 이 작업은 되돌릴
            수 없습니다.
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
              startTransition(() => deleteDeck(deckId))
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
