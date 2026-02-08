'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function FormButtons({ onCancel }: { onCancel: () => void }) {
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
