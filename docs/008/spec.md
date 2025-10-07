## 008. 광고주 체험단 관리

- Primary Actor: 로그인한 광고주(role=advertiser)
- Precondition: 광고주 프로필 완료 상태
- Trigger: "체험단 관리" 진입, 신규 등록 제출

### Main Scenario
1. FE가 신규 등록 다이얼로그에서 입력을 검증한다(제목/설명/모집기간/모집인원/혜택/미션/매장정보 등).
2. FE가 BE에 캠페인 생성 요청을 보낸다.
3. BE는 `campaigns`에 레코드를 생성하고 status=recruiting으로 반환한다.
4. FE는 목록을 갱신한다.

### Edge Cases
- 필수값 누락 → 400
- 기간 역전(recruitment_start > end) → 400
- 인증/권한 부족 → 401/403

### Business Rules
- 모집상태 초기값은 recruiting
- 모집인원은 1 이상

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 체험단 관리 진입/등록 입력
FE -> FE: 로컬 검증
FE -> BE: POST /campaigns
BE -> Database: INSERT campaigns
BE --> FE: 201 Created (recruiting)
FE -> User: 목록 갱신
@enduml

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