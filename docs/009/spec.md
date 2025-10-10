# 광고주 체험단 상세 & 모집 관리

## Primary Actor
- 광고주 (Advertiser)

## Precondition
- 광고주로 로그인되어 있음
- 광고주 프로필 등록이 완료되어 있음
- 최소 1개 이상의 체험단을 등록한 상태

## Trigger
- 광고주가 체험단 관리 페이지에서 특정 체험단 카드 클릭
- 또는 체험단 상세 URL로 직접 접근

## Main Scenario

### 1. 체험단 상세 조회
1. 광고주가 체험단 카드의 "상세보기" 버튼 클릭
2. 시스템이 체험단 상세 정보 조회 (제목, 설명, 혜택, 미션, 매장 정보, 모집 기간, 모집 인원, 현재 지원자 수)
3. 시스템이 지원자 목록 조회 (지원자 이름, 각오 한마디, 방문 예정일, 지원일시, 지원 상태)
4. 화면에 체험단 정보와 지원자 목록 테이블 표시

### 2. 모집 종료
1. 광고주가 "모집 종료" 버튼 클릭
2. 확인 Dialog 표시 ("정말 모집을 종료하시겠습니까?")
3. 광고주가 "확인" 클릭
4. 시스템이 체험단 상태를 `recruiting` → `closed`로 변경
5. 버튼이 "체험단 선정"으로 변경됨
6. 성공 메시지 표시

### 3. 체험단 선정
1. 광고주가 "체험단 선정" 버튼 클릭
2. 지원자 선택 Dialog 표시
3. 광고주가 지원자 목록에서 체크박스로 선정할 인원 선택
4. 선정 인원 수가 모집 인원을 초과하지 않는지 검증
5. "선정 완료" 버튼 클릭
6. 시스템이 선정된 지원자의 상태를 `pending` → `selected`로 변경
7. 미선정 지원자의 상태를 `pending` → `rejected`로 변경
8. 체험단 상태를 `closed` → `completed`로 변경
9. 성공 메시지 표시 및 목록 갱신

## Edge Cases

### 권한 에러
- 인플루언서가 URL로 직접 접근 시 → 403 에러, 접근 거부 메시지
- 다른 광고주의 체험단 접근 시 → 404 에러 또는 접근 거부

### 데이터 에러
- 존재하지 않는 체험단 ID → 404 에러, "체험단을 찾을 수 없습니다"
- 지원자가 없는 상태에서 모집 종료 시도 → 경고 메시지 표시 후 진행 허용
- 네트워크 에러 → "일시적인 오류가 발생했습니다. 다시 시도해주세요"

### 상태 충돌
- 이미 모집 종료된 체험단에 "모집 종료" 시도 → 버튼 비활성화 또는 메시지
- 이미 선정 완료된 체험단에 "선정" 시도 → 버튼 비활성화
- 선정 인원이 모집 인원 초과 → "최대 {모집인원}명까지만 선정 가능합니다" 에러

### 동시성 이슈
- 여러 광고주가 동시에 같은 체험단 수정 시 → Last-Write-Wins (낙관적 잠금)
- 지원자가 지원 취소 중 광고주가 선정 시 → 트랜잭션으로 일관성 보장

## Business Rules

### 모집 종료
- 모집 종료는 모집 기간 내에서만 가능
- 모집 종료 후에는 새로운 지원 불가
- 모집 종료 후 다시 모집 중으로 되돌릴 수 없음
- 지원자가 0명이어도 모집 종료 가능

### 체험단 선정
- 체험단 선정은 모집 종료 상태에서만 가능
- 선정 인원은 모집 인원 이하여야 함
- 최소 1명 이상 선정해야 함
- 선정되지 않은 모든 지원자는 자동으로 반려 처리
- 선정 완료 후에는 선정 결과를 변경할 수 없음

### 상태 전환
- `recruiting` → `closed` → `completed` 순서로만 전환 가능
- 역방향 전환 불가
- 각 상태 전환 시 타임스탬프 기록

### 알림 (향후 구현)
- 모집 종료 시 모든 지원자에게 알림
- 선정 완료 시 선정/반려 결과를 각 지원자에게 알림

---

## Sequence Diagram

\`\`\`plantuml
@startuml
actor User as "광고주"
participant FE as "Frontend"
participant BE as "Backend API"
database DB as "Database"

== 체험단 상세 조회 ==
User -> FE: 체험단 카드 "상세보기" 클릭
FE -> BE: GET /api/campaigns/:id
BE -> DB: SELECT campaign details
DB --> BE: 체험단 정보
BE -> DB: SELECT applications WHERE campaign_id
DB --> BE: 지원자 목록
BE --> FE: { campaign, applications }
FE --> User: 상세 페이지 표시

== 모집 종료 ==
User -> FE: "모집 종료" 버튼 클릭
FE --> User: 확인 Dialog 표시
User -> FE: "확인" 클릭
FE -> BE: PATCH /api/campaigns/:id/close
BE -> DB: SELECT campaign status
DB --> BE: status = "recruiting"
BE -> DB: UPDATE campaigns SET status = "closed"
DB --> BE: 업데이트 성공
BE --> FE: { success, campaign }
FE --> User: "모집이 종료되었습니다" 메시지
FE -> FE: 버튼을 "체험단 선정"으로 변경

== 체험단 선정 ==
User -> FE: "체험단 선정" 버튼 클릭
FE -> BE: GET /api/campaigns/:id/applications
BE -> DB: SELECT * FROM applications WHERE campaign_id AND status = "pending"
DB --> BE: 지원자 목록
BE --> FE: { applications }
FE --> User: 선정 Dialog (지원자 목록)

User -> FE: 지원자 선택 (체크박스)
User -> FE: "선정 완료" 클릭

alt 선정 인원 초과
    FE --> User: "최대 N명까지 선정 가능" 에러
else 정상 선정
    FE -> BE: POST /api/campaigns/:id/select\n{ selected_ids: [...] }
    BE -> DB: SELECT campaign status, recruitment_count
    DB --> BE: 체험단 정보

    alt 상태가 closed가 아님
        BE --> FE: { error: "모집 종료 상태가 아닙니다" }
        FE --> User: 에러 메시지
    else 선정 인원 초과
        BE --> FE: { error: "모집 인원 초과" }
        FE --> User: 에러 메시지
    else 정상 처리
        BE -> DB: BEGIN TRANSACTION
        BE -> DB: UPDATE applications\nSET status = "selected"\nWHERE id IN (selected_ids)
        BE -> DB: UPDATE applications\nSET status = "rejected"\nWHERE campaign_id = :id\nAND status = "pending"
        BE -> DB: UPDATE campaigns\nSET status = "completed"
        BE -> DB: COMMIT
        DB --> BE: 트랜잭션 성공
        BE --> FE: { success, selected_count, rejected_count }
        FE --> User: "N명 선정 완료" 메시지
        FE -> FE: 목록 갱신
    end
end

@enduml
\`\`\`
