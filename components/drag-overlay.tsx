import type { LucideIcon } from 'lucide-react'

export function DragOverlay({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-card/80 px-16 py-14 text-center shadow-2xl">
        <Icon className="mx-auto mb-5 h-10 w-10 text-primary" />
        <p className="text-base font-medium">파일을 여기에 놓으세요</p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, 이미지, 텍스트 파일 지원
        </p>
      </div>
    </div>
  )
}
