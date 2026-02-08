'use client'

import { FileText, ImageIcon, X } from 'lucide-react'

export function FileIcon({ mediaType }: { mediaType: string }) {
  if (mediaType.startsWith('image/'))
    return <ImageIcon className="h-3.5 w-3.5" />
  if (mediaType === 'application/pdf')
    return <FileText className="h-3.5 w-3.5 text-red-400" />
  return <FileText className="h-3.5 w-3.5" />
}

export function FileChip({
  file,
  onRemove,
}: {
  file: { name: string; mediaType: string }
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs">
      <FileIcon mediaType={file.mediaType} />
      <span className="max-w-[140px] truncate">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`${file.name} 제거`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
