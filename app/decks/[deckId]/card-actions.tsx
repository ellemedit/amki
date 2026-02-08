'use client'

import { useTransition, useState } from 'react'
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
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateCard, deleteCard } from './card-actions-server'
import { FormButtons } from '@/components/form-buttons'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function CardActionMenu({
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
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            수정
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
              if (result?.error) {
                toast.error(result.error)
              } else {
                startTransition(() => setEditOpen(false))
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
              <FormButtons onCancel={() => setEditOpen(false)} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="카드 삭제"
        description="이 카드와 학습 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
        onConfirm={async () => {
          await deleteCard(deckId, cardId)
        }}
      />
    </>
  )
}
