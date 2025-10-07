## 009. 광고주 체험단 상세 & 모집 관리

- Primary Actor: 로그인한 광고주(role=advertiser)
- Precondition: 본인이 등록한 캠페인에 접근, 권한 보유
- Trigger: 상세 진입, 모집종료/선정 버튼 클릭

### Main Scenario
1. FE가 상세 정보/지원자 목록 조회를 요청한다.
2. BE는 `campaigns` 상세와 지원자 `applications`를 조회해 반환한다.
3. 광고주는 모집상태 전환(모집종료) 또는 선정 인원 제출을 수행한다.
4. BE는 상태를 `recruitment_closed` 또는 `selection_completed`로 업데이트한다.
5. FE는 변경사항을 반영해 새로 렌더링한다.

### Edge Cases
- 비소유 캠페인 접근 → 403
- 이미 종료/선정된 캠페인 재변경 → 409
- 지원자 없음 상태에서 선정 시도 → 400

### Business Rules
- 모집종료 후에만 선정 가능
- 선정 완료 후 상태는 selection_completed

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 상세/모집관리 진입
FE -> BE: GET /campaigns/{id}/manage
BE -> Database: SELECT campaigns, applications
BE --> FE: 200 OK (detail + applicants)
User -> FE: 모집종료/선정 제출
FE -> BE: PATCH /campaigns/{id} (status or selection)
BE -> Database: UPDATE campaigns / UPDATE applications
BE --> FE: 200 OK
FE -> User: 변경사항 반영
@enduml

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