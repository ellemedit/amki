import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Custom element renderers (extracted to reduce nesting inside <ReactMarkdown>)
// ---------------------------------------------------------------------------

function MdPre({ children }: ComponentPropsWithoutRef<'pre'>) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted/80 p-3.5 text-xs leading-relaxed">
      {children}
    </pre>
  )
}

function MdCode({ children, className }: ComponentPropsWithoutRef<'code'>) {
  if (!className) {
    return (
      <code className="rounded-md bg-muted/80 px-1.5 py-0.5 text-xs font-medium">
        {children}
      </code>
    )
  }
  return <code className={className}>{children}</code>
}

function MdP({ children }: ComponentPropsWithoutRef<'p'>) {
  return <p className="mb-2.5 last:mb-0">{children}</p>
}

function MdUl({ children }: ComponentPropsWithoutRef<'ul'>) {
  return <ul className="mb-2.5 list-disc pl-4 last:mb-0">{children}</ul>
}

function MdOl({ children }: ComponentPropsWithoutRef<'ol'>) {
  return <ol className="mb-2.5 list-decimal pl-4 last:mb-0">{children}</ol>
}

function MdLi({ children }: ComponentPropsWithoutRef<'li'>) {
  return <li className="mb-1">{children}</li>
}

function MdStrong({ children }: ComponentPropsWithoutRef<'strong'>) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

function MdH1({ children }: ComponentPropsWithoutRef<'h1'>) {
  return (
    <h1 className="mb-3 text-lg font-semibold tracking-tight">{children}</h1>
  )
}

function MdH2({ children }: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2 className="mb-2.5 text-base font-semibold tracking-tight">
      {children}
    </h2>
  )
}

function MdH3({ children }: ComponentPropsWithoutRef<'h3'>) {
  return <h3 className="mb-2 text-sm font-semibold">{children}</h3>
}

function MdBlockquote({ children }: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <blockquote className="border-l-2 border-primary/30 pl-3.5 italic text-muted-foreground">
      {children}
    </blockquote>
  )
}

function MdTable({ children }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/40">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  )
}

function MdTh({ children }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th className="border-b border-border/40 bg-muted/50 px-3 py-2 text-left text-xs font-semibold">
      {children}
    </th>
  )
}

function MdTd({ children }: ComponentPropsWithoutRef<'td'>) {
  return <td className="border-b border-border/20 px-3 py-2">{children}</td>
}

function MdHr() {
  return <hr className="my-4 border-border/30" />
}

function MdA({ children, href }: ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

// ---------------------------------------------------------------------------
// Component map (single flat object, no inline functions)
// ---------------------------------------------------------------------------

const mdComponents = {
  pre: MdPre,
  code: MdCode,
  p: MdP,
  ul: MdUl,
  ol: MdOl,
  li: MdLi,
  strong: MdStrong,
  h1: MdH1,
  h2: MdH2,
  h3: MdH3,
  blockquote: MdBlockquote,
  table: MdTable,
  th: MdTh,
  td: MdTd,
  hr: MdHr,
  a: MdA,
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn('prose prose-sm prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
