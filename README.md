# Amki - 스마트 암기 카드

SM-2 알고리즘 기반 간격 반복 학습 앱. AI와 대화하며 학습 자료에서 암기 카드를 자동 생성할 수 있습니다.

## 주요 기능

- **AI 카드 생성** - 텍스트, 이미지, PDF를 업로드하면 Claude가 핵심 개념을 카드로 만들어 줍니다
- **간격 반복 학습** - SM-2 알고리즘으로 최적의 복습 시점을 자동 계산
- **주관식 채점** - AI가 서술형 답안을 채점하고 피드백 제공
- **덱 관리** - 주제별로 카드를 덱으로 분류

## 기술 스택

- **프레임워크** - Next.js 16 (App Router, React Compiler)
- **AI** - Vercel AI SDK + Anthropic Claude
- **DB** - PostgreSQL + Drizzle ORM
- **UI** - Tailwind CSS v4 + shadcn/ui
- **테스트** - Vitest + Playwright

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
