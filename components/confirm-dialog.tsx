'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = '삭제',
  variant = 'destructive',
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            variant={variant}
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await onConfirm()
                setOpen(false)
              })
            }}
          >
            {isPending && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
