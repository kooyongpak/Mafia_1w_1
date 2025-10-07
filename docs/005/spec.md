## 005. 체험단 상세

- Primary Actor: 로그인 사용자
- Precondition: 캠페인 목록에서 상세 진입 가능, 캠페인 식별자 보유
- Trigger: 상세 페이지 진입

### Main Scenario
1. FE가 캠페인 id로 상세 조회를 요청한다.
2. BE는 `campaigns`에서 상세/모집조건을 조회한다.
3. BE는 권한 가드를 위해 사용자 프로필 상태를 확인한다(인플루언서 완료 여부).
4. FE는 상세 정보를 렌더링하고, 지원 버튼을 조건에 따라 노출한다.

### Edge Cases
- 캠페인 미존재/종료 → 404/가드 메시지
- 권한 불충분(미완료 인플루언서) → 지원 버튼 비활성

### Business Rules
- 모집기간 외에는 지원 비활성

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 상세 페이지 진입
FE -> BE: GET /campaigns/{id}
BE -> Database: SELECT campaigns BY id
BE -> Database: SELECT influencer_profiles BY user
BE --> FE: 200 OK (campaign, guard)
FE -> User: 상세/버튼 렌더링
@enduml

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
1. 사용자가 홈페이지에서 체험단 카드 클릭
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