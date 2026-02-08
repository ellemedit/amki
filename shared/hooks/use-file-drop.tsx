'use client'

import { useRef, useState, useCallback, type DragEvent } from 'react'
import {
  fileToDataURL,
  validateFileSize,
  type FileAttachment,
} from '@/shared/file'

export interface UseFileDropOptions {
  accept?: string
  onFiles: (files: FileAttachment[]) => void
  onError?: (message: string) => void
}

export interface UseFileDropReturn {
  isDragging: boolean
  dropHandlers: {
    onDragOver: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
  }
  fileInputRef: React.RefObject<HTMLInputElement | null>
  openFilePicker: () => void
  FileInput: () => React.JSX.Element
}

export function useFileDrop({
  accept = 'image/*,.pdf,.txt,.md,.csv',
  onFiles,
  onError,
}: UseFileDropOptions): UseFileDropReturn {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const attachments: FileAttachment[] = []
      for (const file of Array.from(fileList)) {
        const sizeError = validateFileSize(file)
        if (sizeError) {
          onError?.(sizeError)
          continue
        }
        const url = await fileToDataURL(file)
        attachments.push({ name: file.name, mediaType: file.type, url })
      }
      if (attachments.length > 0) onFiles(attachments)
    },
    [onFiles, onError],
  )

  const dropHandlers = {
    onDragOver(e: DragEvent) {
      e.preventDefault()
      setIsDragging(true)
    },
    onDragLeave(e: DragEvent) {
      e.preventDefault()
      setIsDragging(false)
    },
    onDrop(e: DragEvent) {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function FileInput() {
    return (
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files)
          e.target.value = ''
        }}
      />
    )
  }

  return { isDragging, dropHandlers, fileInputRef, openFilePicker, FileInput }
}
