export interface FileAttachment {
  name: string
  mediaType: string
  url: string
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function validateFileSize(
  file: File,
  maxSize = MAX_FILE_SIZE,
): string | null {
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return `${file.name}의 크기가 ${maxMB}MB를 초과합니다.`;
  }
  return null;
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
