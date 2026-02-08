'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * 글로벌 에러 바운더리.
 * 런타임 에러 발생 시 사용자에게 복구 옵션을 제공합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">오류가 발생했습니다</h1>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {error.message ||
            '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.'}
        </p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  )
}
