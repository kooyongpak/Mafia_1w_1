## 006. 체험단 지원

- Primary Actor: 로그인한 인플루언서(role=influencer)
- Precondition: 인플루언서 프로필이 완료 상태, 캠페인 모집중
- Trigger: 상세 페이지에서 "지원" 클릭 후 폼 제출(각오/방문 예정일자)

### Main Scenario
1. FE가 폼 입력(각오/방문 예정일자)을 검증한다.
2. FE가 BE에 지원 생성 요청을 보낸다.
3. BE는 모집기간과 중복 지원을 가드한다.
4. BE는 `applications`에 레코드를 생성하고 status=applied를 반환한다.
5. FE는 성공 피드백과 함께 내 지원 목록 갱신을 유도한다.

### Edge Cases
- 모집기간 외/캠페인 상태 변경 → 400/409
- 중복 지원 → 409
- 인증 만료 → 401

### Business Rules
- (campaign_id, influencer_id)는 유니크
- planned_visit_date는 현재 날짜 이후여야 함(정책 적용 시)

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 입력(각오/방문일)
FE -> FE: 로컬 검증
FE -> BE: POST /applications
BE -> Database: CHECK period/status & duplicates
BE -> Database: INSERT applications
BE --> FE: 201 Created (applied)
FE -> User: 성공 피드백/목록 갱신
@enduml




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