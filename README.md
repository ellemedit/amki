# Amki - 스마트 암기 카드

SM-2 알고리즘 기반 간격 반복 학습 앱. AI와 대화하며 학습 자료에서 암기 카드를 자동 생성할 수 있습니다.

## 주요 기능

- **AI 카드 생성** - 텍스트, 이미지, PDF를 업로드하면 Claude가 핵심 개념을 카드로 만들어 줍니다
- **간격 반복 학습** - SM-2 알고리즘으로 최적의 복습 시점을 자동 계산
- **주관식 채점** - AI가 서술형 답안을 채점하고 피드백 제공
- **덱 관리** - 주제별로 카드를 덱으로 분류
- **마크다운 지원** - 카드 앞/뒷면에 코드 블록, 표, 리스트 등 마크다운 렌더링
- **대화 기록 보존** - AI 채팅 세션이 DB에 저장되어 이어서 카드 생성 가능

## 기술 스택

- **프레임워크** - Next.js 16 (App Router, React Compiler)
- **AI** - Vercel AI SDK v6 + Anthropic Claude (tool calling, streaming)
- **DB** - PostgreSQL + Drizzle ORM
- **UI** - Tailwind CSS v4 + shadcn/ui
- **테스트** - Vitest + Playwright

## 프로젝트 구조

```
amki/
├── app/                          # Next.js App Router
│   ├── api/chat/cards/           #   AI 카드 생성 API (streaming + tool calling)
│   ├── decks/
│   │   ├── new/                  #   새 덱 생성 페이지
│   │   └── [deckId]/
│   │       ├── page.tsx          #   덱 상세 (통계, 카드 목록)
│   │       ├── cards/new/        #   AI 채팅 카드 생성 페이지
│   │       └── study/            #   학습 세션 (SM-2 복습)
│   ├── layout.tsx                #   루트 레이아웃 (다크 테마, Geist 폰트)
│   └── page.tsx                  #   홈 (덱 목록)
│
├── features/                     # 도메인별 기능 모듈
│   ├── cards/                    #   카드 CRUD (schema, queries, mutations)
│   ├── chat/                     #   AI 채팅 세션 저장/복원
│   ├── decks/                    #   덱 CRUD
│   └── study/                    #   학습 진행도, 복습 로그 (SM-2)
│
├── components/
│   ├── markdown.tsx              #   마크다운 렌더러 (react-markdown + remark-gfm)
│   ├── back-button.tsx           #   뒤로가기 버튼
│   └── ui/                       #   shadcn/ui 컴포넌트
│
├── db/
│   ├── index.ts                  #   Drizzle 클라이언트 (PostgreSQL)
│   └── schema/index.ts           #   전체 스키마 re-export
│
├── lib/
│   ├── sm2.ts                    #   SM-2 간격 반복 알고리즘
│   ├── similarity.ts             #   텍스트 유사도 (AI 폴백용)
│   └── utils.ts                  #   cn() 등 유틸리티
│
├── docker-compose.yml            # PostgreSQL 로컬 실행
├── drizzle.config.ts             # Drizzle Kit 설정
└── next.config.ts                # Next.js 설정 (React Compiler 등)
```

## 시작하기

### 1. 환경 변수 설정

```bash
cp .env.sample .env.local
```

`.env.local`을 열고 `ANTHROPIC_API_KEY`를 입력하세요.

### 2. DB 실행

```bash
docker compose up -d
```

### 3. DB 마이그레이션

```bash
bun run db:push
```

### 4. 개발 서버

```bash
bun run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 스크립트

| 명령어              | 설명                |
| ------------------- | ------------------- |
| `bun run dev`       | 개발 서버 실행      |
| `bun run build`     | 프로덕션 빌드       |
| `bun run test`      | 단위 테스트         |
| `bun run test:e2e`  | E2E 테스트          |
| `bun run db:push`   | DB 스키마 동기화    |
| `bun run db:studio` | Drizzle Studio 실행 |
