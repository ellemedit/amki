import Link from 'next/link'
import { createDeck } from '@/app/actions/deck-actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'

export default function NewDeckPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">새 덱 만들기</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>덱 정보</CardTitle>
            <CardDescription>새로운 플래시카드 덱을 만드세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDeck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">덱 이름</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="예: 영어 단어, 한국사, React 개념"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="이 덱에 대한 간단한 설명"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">덱 만들기</Button>
                <Link href="/">
                  <Button type="button" variant="outline">
                    취소
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
