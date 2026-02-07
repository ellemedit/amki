'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createCard } from '@/app/actions/card-actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function NewCardPage() {
  const params = useParams<{ deckId: string }>()
  const [type, setType] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addedCount, setAddedCount] = useState(0)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    formData.set('type', type)

    const result = await createCard(params.deckId, formData)
    setIsSubmitting(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    setAddedCount((c) => c + 1)
    toast.success('카드가 추가되었습니다.')

    // Reset form
    const form = document.getElementById('card-form') as HTMLFormElement
    form?.reset()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href={`/decks/${params.deckId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">카드 추가</h1>
            {addedCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {addedCount}장 추가됨
              </p>
            )}
          </div>
          <Link href={`/decks/${params.deckId}`}>
            <Button variant="outline">
              <Check className="mr-2 h-4 w-4" />
              완료
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>새 카드</CardTitle>
            <CardDescription>
              앞면에 질문을, 뒷면에 답을 입력하세요. 연속으로 추가할 수
              있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="card-form" action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">카드 유형</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      기본 - 답을 보고 직접 평가
                    </SelectItem>
                    <SelectItem value="subjective">
                      주관식 - AI가 답안 채점
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="front">앞면 (질문)</Label>
                <Textarea
                  id="front"
                  name="front"
                  placeholder="질문 또는 암기할 내용의 앞면"
                  rows={3}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="back">뒷면 (답)</Label>
                <Textarea
                  id="back"
                  name="back"
                  placeholder="정답 또는 암기할 내용의 뒷면"
                  rows={3}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? '추가 중...' : '카드 추가'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
