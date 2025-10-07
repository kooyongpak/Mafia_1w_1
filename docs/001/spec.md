## 001. 회원가입 & 역할선택

- Primary Actor: 비로그인 사용자
- Precondition: 사용자 브라우저에서 서비스 홈 접근 가능, 네트워크 연결 양호
- Trigger: 회원가입 양식 작성 후 "다음" 또는 "가입" 버튼 클릭

### Main Scenario
1. FE가 사용자 입력(이름, 휴대폰번호, 이메일, 약관동의, 역할, 인증방식)을 로컬 검증한다.
2. FE가 BE에 회원 생성 요청을 보낸다.
3. BE는 Auth 계정 생성(Supabase) 후 `users`에 최소 프로필을 저장한다.
4. BE는 `terms_agreements`에 약관 동의 이력을 기록한다.
5. BE는 성공 응답을 반환하고, FE는 역할별 다음 단계로 라우팅한다.

### Edge Cases
- 이메일/전화 중복 또는 형식 오류 → 400과 메시지 반환, FE는 인라인 에러 노출
- Auth 생성 실패 → 500, 재시도/문의 안내
- 네트워크 오류 → 재시도 버튼 제공

### Business Rules
- 역할은 advertiser|influencer 중 하나여야 한다.
- 약관 동의 없이는 회원가입 완료 불가.
- `users.email`은 유일해야 한다.

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 입력(이름/전화/이메일/역할/약관)
FE -> FE: 로컬 검증
FE -> BE: POST /auth/sign-up (payload)
BE -> Database: INSERT auth (Supabase)
BE -> Database: INSERT users (기본 정보)
BE -> Database: INSERT terms_agreements
BE --> FE: 201 Created (user id)
FE -> User: 성공 메시지/역할별 다음 단계 라우팅
@enduml

# 001. 회원가입 & 역할선택

## Primary Actor
신규 사용자

## Precondition
- 사용자가 회원가입 페이지에 접근
- 유효한 이메일과 휴대폰번호 보유

## Trigger
사용자가 "회원가입" 버튼 클릭

## Main Scenario
1. 사용자가 이름, 휴대폰번호, 이메일 입력
2. 약관 동의 체크박스 선택
3. 역할 선택 (광고주/인플루언서)
4. 인증 방식 선택 (이메일/외부)
5. "회원가입" 버튼 클릭
6. 시스템이 입력값 유효성 검사
7. Supabase Auth 계정 생성
8. users 테이블에 기본 정보 저장
9. terms_agreements 테이블에 약관 동의 이력 저장
10. 이메일 인증 메일 발송
11. 성공 메시지 표시 및 역할별 온보딩 페이지로 이동

## Edge Cases
- **중복 이메일**: "이미 가입된 이메일입니다" 메시지 표시
- **유효하지 않은 이메일 형식**: "올바른 이메일 형식을 입력해주세요" 메시지 표시
- **중복 휴대폰번호**: "이미 가입된 휴대폰번호입니다" 메시지 표시
- **약관 미동의**: "약관에 동의해주세요" 메시지 표시
- **네트워크 오류**: "일시적인 오류가 발생했습니다. 다시 시도해주세요" 메시지 표시

## Business Rules
- 이메일은 중복될 수 없음
- 휴대폰번호는 중복될 수 없음
- 약관 동의는 필수
- 역할은 광고주 또는 인플루언서 중 하나만 선택 가능
- 이메일 인증 완료 후 서비스 이용 가능

## Sequence Diagram
```plantuml
User -> FE: 회원가입 정보 입력
FE -> BE: POST /api/auth/signup
BE -> Database: 사용자 정보 저장
BE -> Database: 약관 동의 이력 저장
BE -> BE: 이메일 인증 메일 발송
BE -> FE: 성공 응답
FE -> User: 성공 메시지 및 온보딩 페이지 이동
```
```

## 002. 인플루언서 정보 등록

```markdown:docs/002/spec.md
# 002. 인플루언서 정보 등록

## Primary Actor
인플루언서 역할 사용자

## Precondition
- 사용자가 회원가입 완료
- 인플루언서 역할로 선택됨
- 이메일 인증 완료

## Trigger
인플루언서 정보 등록 페이지 접근

## Main Scenario
1. 사용자가 생년월일 입력
2. SNS 채널 정보 입력 (채널 유형, 채널명, URL)
3. 채널 추가/편집/삭제 기능 사용
4. "제출" 또는 "임시저장" 버튼 클릭
5. 시스템이 날짜/URL 정규화 및 유효성 검사
6. 나이 정책 검증 (최소 연령 확인)
7. influencer_profiles 테이블에 정보 저장
8. influencer_channels 테이블에 채널 정보 저장
9. 비동기 채널 검증 작업 시작
10. 성공 메시지 표시 및 프로필 완료 상태 업데이트

## Edge Cases
- **미성년자**: "만 18세 이상만 가입 가능합니다" 메시지 표시
- **유효하지 않은 URL**: "올바른 URL 형식을 입력해주세요" 메시지 표시
- **중복 채널**: "이미 등록된 채널입니다" 메시지 표시
- **채널 검증 실패**: "채널 정보를 확인해주세요" 메시지 표시

## Business Rules
- 만 18세 이상만 가입 가능
- 최소 1개 이상의 SNS 채널 등록 필수
- 채널 URL은 유효한 형식이어야 함
- 프로필 완료 후 체험단 지원 가능

## Sequence Diagram
```plantuml
User -> FE: 인플루언서 정보 입력
FE -> BE: POST /api/influencer/profile
BE -> Database: influencer_profiles 저장
BE -> Database: influencer_channels 저장
BE -> BE: 비동기 채널 검증 시작
BE -> FE: 성공 응답
FE -> User: 성공 메시지 및 프로필 완료 상태 표시
```
```

## 003. 광고주 정보 등록

```markdown:docs/003/spec.md
# 003. 광고주 정보 등록

## Primary Actor
광고주 역할 사용자

## Precondition
- 사용자가 회원가입 완료
- 광고주 역할로 선택됨
- 이메일 인증 완료

## Trigger
광고주 정보 등록 페이지 접근

## Main Scenario
1. 사용자가 업체명, 위치, 카테고리 입력
2. 사업자등록번호 입력
3. "제출" 또는 "임시저장" 버튼 클릭
4. 시스템이 필드 정규화 및 유효성 검사
5. 사업자등록번호 형식 및 중복 검증
6. advertiser_profiles 테이블에 정보 저장
7. 비동기 사업자등록번호 검증 작업 시작
8. 성공 메시지 표시 및 프로필 완료 상태 업데이트
9. 체험단 관리 권한 부여

## Edge Cases
- **중복 사업자등록번호**: "이미 등록된 사업자등록번호입니다" 메시지 표시
- **유효하지 않은 사업자등록번호**: "올바른 사업자등록번호를 입력해주세요" 메시지 표시
- **사업자등록번호 검증 실패**: "사업자등록번호를 확인해주세요" 메시지 표시

## Business Rules
- 사업자등록번호는 중복될 수 없음
- 사업자등록번호는 유효한 형식이어야 함
- 프로필 완료 후 체험단 등록 가능
- 사업자등록번호 검증 완료 후 정식 서비스 이용 가능

## Sequence Diagram
```plantuml
User -> FE: 광고주 정보 입력
FE -> BE: POST /api/advertiser/profile
BE -> Database: advertiser_profiles 저장
BE -> BE: 비동기 사업자등록번호 검증 시작
BE -> FE: 성공 응답
FE -> User: 성공 메시지 및 체험단 관리 권한 부여
```
```

## 004. 홈 & 체험단 목록 탐색

```markdown:docs/004/spec.md
# 004. 홈 & 체험단 목록 탐색

## Primary Actor
인플루언서

## Precondition
- 사용자가 로그인 상태
- 인플루언서 프로필 등록 완료

## Trigger
홈 페이지 접근

## Main Scenario
1. 사용자가 홈 페이지 접근
2. 시스템이 모집 중인 체험단 목록 조회
3. 배너 정보 로드
4. 체험단 목록을 카드 형태로 표시 (최신순 정렬)
5. 사용자가 필터/정렬 옵션 선택
6. 필터링된 결과 표시
7. 사용자가 관심 있는 체험단 카드 클릭
8. 체험단 상세 페이지로 이동

## Edge Cases
- **모집 중인 체험단 없음**: "현재 모집 중인 체험단이 없습니다" 메시지 표시
- **네트워크 오류**: "일시적인 오류가 발생했습니다" 메시지 표시
- **권한 없음**: "인플루언서 등록을 완료해주세요" 메시지 표시

## Business Rules
- 모집 중인 체험단만 표시
- 기본 정렬은 최신순
- 인플루언서 등록 완료 후 접근 가능

## Sequence Diagram
```plantuml
User -> FE: 홈 페이지 접근
FE -> BE: GET /api/campaigns?status=recruiting
BE -> Database: 모집 중인 체험단 조회
Database -> BE: 체험단 목록 반환
BE -> FE: 체험단 목록 응답
FE -> User: 체험단 카드 목록 표시
User -> FE: 체험단 카드 클릭
FE -> User: 체험단 상세 페이지 이동
```
```

## 005. 체험단 상세

```markdown:docs/005/spec.md
# 005. 체험단 상세

## Primary Actor
인플루언서

## Precondition
- 사용자가 로그인 상태
- 인플루언서 프로필 등록 완료
- 모집 중인 체험단 존재

## Trigger
체험단 카드 클릭

## Main Scenario
1. 사용자가 체험단 카드 클릭
2. 시스템이 체험단 상세 정보 조회
3. 모집기간, 제공혜택, 미션, 매장정보, 모집인원 표시
4. 사용자 권한 체크 (인플루언서 등록 완료 여부)
5. 지원 가능 여부 확인
6. "지원하기" 버튼 노출 (지원 가능한 경우)
7. 사용자가 "지원하기" 버튼 클릭
8. 체험단 지원 페이지로 이동

## Edge Cases
- **이미 지원한 체험단**: "이미 지원한 체험단입니다" 메시지 표시
- **모집 기간 종료**: "모집이 종료된 체험단입니다" 메시지 표시
- **인플루언서 등록 미완료**: "인플루언서 등록을 완료해주세요" 메시지 표시
- **체험단 없음**: "존재하지 않는 체험단입니다" 메시지 표시

## Business Rules
- 모집 중인 체험단만 지원 가능
- 중복 지원 불가
- 인플루언서 등록 완료 후 지원 가능

## Sequence Diagram
```plantuml
User -> FE: 체험단 카드 클릭
FE -> BE: GET /api/campaigns/:id
BE -> Database: 체험단 상세 정보 조회
Database -> BE: 체험단 정보 반환
BE -> FE: 체험단 상세 정보 응답
FE -> User: 체험단 상세 정보 표시
User -> FE: 지원하기 버튼 클릭
FE -> User: 체험단 지원 페이지 이동
```
```

## 006. 체험단 지원

```markdown:docs/006/spec.md
# 006. 체험단 지원

## Primary Actor
인플루언서

## Precondition
- 사용자가 로그인 상태
- 인플루언서 프로필 등록 완료
- 모집 중인 체험단 선택
- 아직 지원하지 않은 체험단

## Trigger
"지원하기" 버튼 클릭

## Main Scenario
1. 사용자가 각오 한마디 입력
2. 방문 예정일자 선택
3. "지원하기" 버튼 클릭
4. 시스템이 입력값 유효성 검사
5. 중복 지원 방지 체크
6. 모집기간 내 여부 확인
7. applications 테이블에 지원 정보 저장
8. 성공 메시지 표시
9. 내 지원 목록 업데이트
10. 감사 로그 기록

## Edge Cases
- **중복 지원**: "이미 지원한 체험단입니다" 메시지 표시
- **모집 기간 종료**: "모집이 종료된 체험단입니다" 메시지 표시
- **유효하지 않은 날짜**: "올바른 날짜를 선택해주세요" 메시지 표시
- **빈 각오 한마디**: "각오 한마디를 입력해주세요" 메시지 표시

## Business Rules
- 중복 지원 불가
- 모집기간 내에만 지원 가능
- 각오 한마디는 필수 입력
- 방문 예정일자는 미래 날짜여야 함

## Sequence Diagram
```plantuml
User -> FE: 지원 정보 입력
FE -> BE: POST /api/applications
BE -> Database: 중복 지원 체크
BE -> Database: applications 저장
BE -> Database: 감사 로그 기록
BE -> FE: 성공 응답
FE -> User: 성공 메시지 및 내 지원 목록 업데이트
```
```

## 007. 내 지원 목록

```markdown:docs/007/spec.md
# 007. 내 지원 목록

## Primary Actor
인플루언서

## Precondition
- 사용자가 로그인 상태
- 인플루언서 프로필 등록 완료
- 최소 1개 이상의 체험단 지원 이력

## Trigger
"내 지원 목록" 메뉴 클릭

## Main Scenario
1. 사용자가 "내 지원 목록" 메뉴 클릭
2. 시스템이 사용자의 지원 목록 조회
3. 지원 목록을 상태별로 표시 (신청완료/선정/반려)
4. 사용자가 상태 필터 선택
5. 필터링된 결과 표시
6. 각 지원의 상세 상태 확인
7. 지원 취소 (신청완료 상태인 경우)

## Edge Cases
- **지원 이력 없음**: "아직 지원한 체험단이 없습니다" 메시지 표시
- **네트워크 오류**: "일시적인 오류가 발생했습니다" 메시지 표시
- **권한 없음**: "인플루언서 등록을 완료해주세요" 메시지 표시

## Business Rules
- 본인의 지원 목록만 조회 가능
- 신청완료 상태인 경우에만 지원 취소 가능
- 선정/반려 상태는 변경 불가

## Sequence Diagram
```plantuml
User -> FE: 내 지원 목록 메뉴 클릭
FE -> BE: GET /api/applications/my
BE -> Database: 사용자 지원 목록 조회
Database -> BE: 지원 목록 반환
BE -> FE: 지원 목록 응답
FE -> User: 지원 목록 표시
User -> FE: 상태 필터 선택
FE -> BE: GET /api/applications/my?status=selected
BE -> Database: 필터링된 지원 목록 조회
Database -> BE: 필터링된 결과 반환
BE -> FE: 필터링된 결과 응답
FE -> User: 필터링된 지원 목록 표시
```
```

## 008. 광고주 체험단 관리

```markdown:docs/008/spec.md
# 008. 광고주 체험단 관리

## Primary Actor
광고주

## Precondition
- 사용자가 로그인 상태
- 광고주 프로필 등록 완료
- 이메일 인증 완료

## Trigger
"체험단 관리" 메뉴 클릭

## Main Scenario
1. 사용자가 "체험단 관리" 메뉴 클릭
2. 시스템이 광고주의 체험단 목록 조회
3. 체험단 목록을 카드/테이블 형태로 표시
4. 사용자가 "신규 체험단 등록" 버튼 클릭
5. 체험단 등록 Dialog 표시
6. 사용자가 체험단 정보 입력 (체험단명, 모집기간, 모집인원, 제공혜택, 매장정보, 미션)
7. "등록" 버튼 클릭
8. 시스템이 광고주 권한 검증
9. 필드 유효성 검사
10. campaigns 테이블에 체험단 정보 저장 (상태=모집중)
11. 성공 메시지 표시 및 목록 갱신

## Edge Cases
- **권한 없음**: "광고주 등록을 완료해주세요" 메시지 표시
- **필수 필드 누락**: "필수 정보를 모두 입력해주세요" 메시지 표시
- **유효하지 않은 날짜**: "올바른 날짜를 선택해주세요" 메시지 표시
- **네트워크 오류**: "일시적인 오류가 발생했습니다" 메시지 표시

## Business Rules
- 광고주 등록 완료 후 체험단 등록 가능
- 모든 필수 필드 입력 필수
- 모집 시작일은 현재 날짜 이후여야 함
- 모집 종료일은 시작일 이후여야 함

## Sequence Diagram
```plantuml
User -> FE: 체험단 관리 메뉴 클릭
FE -> BE: GET /api/campaigns/my
BE -> Database: 광고주 체험단 목록 조회
Database -> BE: 체험단 목록 반환
BE -> FE: 체험단 목록 응답
FE -> User: 체험단 목록 표시
User -> FE: 신규 체험단 등록 버튼 클릭
FE -> User: 체험단 등록 Dialog 표시
User -> FE: 체험단 정보 입력
FE -> BE: POST /api/campaigns
BE -> Database: campaigns 저장
BE -> FE: 성공 응답
FE -> User: 성공 메시지 및 목록 갱신
```
```

## 009. 광고주 체험단 상세 & 모집 관리

```markdown:docs/009/spec.md
# 009. 광고주 체험단 상세 & 모집 관리

## Primary Actor
광고주

## Precondition
- 사용자가 로그인 상태
- 광고주 프로필 등록 완료
- 등록한 체험단 존재

## Trigger
체험단 상세 페이지 접근

## Main Scenario
1. 사용자가 체험단 상세 페이지 접근
2. 시스템이 체험단 정보 및 지원자 목록 조회
3. 신청 현황 테이블 표시
4. 모집 중인 경우 "모집종료" 버튼 표시
5. 사용자가 "모집종료" 버튼 클릭
6. campaigns 테이블 상태를 "모집종료"로 업데이트
7. "체험단 선정" 버튼 표시
8. 사용자가 "체험단 선정" 버튼 클릭
9. 선정 인원 선택 Dialog 표시
10. 사용자가 선정할 인원 선택
11. "선정 완료" 버튼 클릭
12. applications 테이블 상태 업데이트 (선정/반려)
13. campaigns 테이블 상태를 "선정완료"로 업데이트
14. 성공 메시지 표시 및 결과 반영

## Edge Cases
- **권한 없음**: "해당 체험단의 관리자만 접근 가능합니다" 메시지 표시
- **이미 모집종료**: "이미 모집이 종료된 체험단입니다" 메시지 표시
- **이미 선정완료**: "이미 선정이 완료된 체험단입니다" 메시지 표시
- **선정 인원 없음**: "선정할 인원을 선택해주세요" 메시지 표시

## Business Rules
- 본인이 등록한 체험단만 관리 가능
- 모집 중 → 모집종료 → 선정완료 순서로 진행
- 선정 인원은 1명 이상 선택 필수
- 선정 완료 후 상태 변경 불가

## Sequence Diagram
```plantuml
User -> FE: 체험단 상세 페이지 접근
FE -> BE: GET /api/campaigns/:id
BE -> Database: 체험단 정보 조회
BE -> Database: 지원자 목록 조회
Database -> BE: 체험단 및 지원자 정보 반환
BE -> FE: 체험단 상세 정보 응답
FE -> User: 신청 현황 테이블 표시
User -> FE: 모집종료 버튼 클릭
FE -> BE: PUT /api/campaigns/:id/close
BE -> Database: campaigns 상태 업데이트
BE -> FE: 성공 응답
FE -> User: 체험단 선정 버튼 표시
User -> FE: 체험단 선정 버튼 클릭
FE -> User: 선정 인원 선택 Dialog 표시
User -> FE: 선정 인원 선택
FE -> BE: PUT /api/campaigns/:id/select
BE -> Database: applications 상태 업데이트
BE -> Database: campaigns 상태 업데이트
BE -> FE: 성공 응답
FE -> User: 성공 메시지 및 결과 반영
```
```

---

모든 기능별 상세 유스케이스가 `/docs/00N/spec.md` 경로에 저장되었습니다. 각 파일은 다음 내용을 포함합니다:

- **Primary Actor**: 주요 사용자
- **Precondition**: 사전 조건
- **Trigger**: 트리거 이벤트
- **Main Scenario**: 주요 시나리오
- **Edge Cases**: 예외 상황 및 처리
- **Business Rules**: 비즈니스 규칙
- **Sequence Diagram**: PlantUML 시퀀스 다이어그램

각 유스케이스는 검토하기 쉽게 간결하게 작성되었으며, 개발 시 참고할 수 있는 상세한 정보를 제공합니다.