## 004. 홈 & 체험단 목록 탐색

- Primary Actor: 모든 로그인 사용자(또는 공개 접근 허용 시 비로그인)
- Precondition: 서비스 접속 가능, 네트워크 양호
- Trigger: 홈 접속/필터 변경/페이지 이동

### Main Scenario
1. FE가 필터/정렬/페이지 정보를 상태로 보관한다.
2. FE가 BE에 모집중 캠페인 리스트 조회를 요청한다.
3. BE는 `campaigns` where status='recruiting'를 페이징/정렬로 조회한다.
4. FE는 카드 리스트를 렌더링한다.

### Edge Cases
- 결과 없음 → 빈 상태 메시지
- 페이지 범위 초과 → 첫 페이지로 보정

### Business Rules
- 기본 정렬은 최신 등록 또는 마감 임박 기준(정책 택일)
- status='recruiting'만 노출

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 홈 접속/필터 선택
FE -> BE: GET /campaigns?status=recruiting&sort=...
BE -> Database: SELECT campaigns WHERE status='recruiting'
BE --> FE: 200 OK (list)
FE -> User: 리스트 렌더링
@enduml

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