## 007. 내 지원 목록 (인플루언서 전용)

- Primary Actor: 로그인한 인플루언서(role=influencer)
- Precondition: 계정 로그인 상태
- Trigger: 메뉴에서 "내 지원 목록" 진입, 상태 필터 변경

### Main Scenario
1. FE가 상태 필터를 바탕으로 목록 조회를 요청한다.
2. BE는 `applications` where influencer_id=본인, status 필터를 적용해 조회한다.
3. FE는 목록을 렌더링한다.

### Edge Cases
- 결과 없음 → 빈 상태 메시지
- 인증 만료 → 401, 로그인 유도

### Business Rules
- 본인 소유 데이터만 접근 가능(서버 가드)

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 내 지원 목록 진입/필터 선택
FE -> BE: GET /applications?mine=1&status=...
BE -> Database: SELECT applications WHERE influencer_id=me
BE --> FE: 200 OK (list)
FE -> User: 목록 렌더링
@enduml


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

