## 기술 스택(현재)

- **프레임워크/언어**
  - Next.js(App Router, Turbopack), React 18, TypeScript

- **라우팅/백엔드**
  - Hono(Next.js Route Handler 위임: `src/app/api/[[...hono]]/route.ts`)
  - Node.js runtime(`export const runtime = 'nodejs'`)

- **인증/데이터베이스**
  - Supabase(@supabase/supabase-js, @supabase/ssr)
  - Admin API `auth.admin.createUser` 사용(이메일 검증 우회), 서비스 롤 키 기반 서버 클라이언트
  - SQL 마이그레이션: `supabase/migrations`

- **HTTP 클라이언트**
  - Axios(`src/lib/remote/api-client.ts`, baseURL=/api)

- **상태/데이터 패칭**
  - @tanstack/react-query(캐시/무효화/동기화)

- **UI/스타일**
  - shadcn-ui, Tailwind CSS, lucide-react(아이콘)

- **폼/검증**
  - zod(스키마/런타임 검증)
  - react-hook-form(일부 폼은 커스텀 핸들러 병용)

- **유틸/로직**
  - ts-pattern(타입 안전 분기)
  - date-fns(날짜 유틸)
  - crypto(이메일 정규화 해시)

- **상태 관리(글로벌)**
  - React Context(`CurrentUserContext`) 중심

- **빌드/개발 도구**
  - npm, ESLint, PostCSS, Turbopack(dev)

- **프로젝트 구조**
  - App Router + Feature 모듈(`src/features/*`)
  - Hono 백엔드 계층(`src/backend/*`)
  - UI 컴포넌트(`src/components/ui`)


