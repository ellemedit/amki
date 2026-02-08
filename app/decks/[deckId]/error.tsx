'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * 덱 관련 페이지의 에러 바운더리.
 * 덱 로딩/조작 중 에러 발생 시 홈으로 돌아갈 수 있는 옵션을 제공합니다.
 */
export default function DeckError({
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
        <h1 className="mb-2 text-xl font-semibold">덱을 불러올 수 없습니다</h1>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {error.message || '덱 데이터를 로드하는 중 오류가 발생했습니다.'}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={reset}>
            다시 시도
          </Button>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
