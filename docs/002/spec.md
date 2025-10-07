## 002. 인플루언서 정보 등록

- Primary Actor: 로그인한 인플루언서(role=influencer)
- Precondition: 사용자 계정이 존재하며 로그인 상태, 기본 회원 정보가 `users`에 존재
- Trigger: 인플루언서 등록 폼에서 제출 클릭

### Main Scenario
1. FE가 생년월일/채널(유형/이름/URL)을 입력받고 검증한다.
2. FE가 BE에 프로필 저장 요청을 보낸다.
3. BE는 `influencer_profiles`를 upsert하고 `is_profile_complete`를 갱신한다.
4. BE는 `influencer_channels`를 생성/업데이트한다(verification_status=pending).
5. FE는 완료 메시지와 함께 지원 가능 상태로 전환한다.

### Edge Cases
- 생년월일 미입력/미성년 → 400
- 채널 URL 형식 오류/중복 채널 → 400/409
- 인증 만료 → 401, 로그인 페이지로 이동

### Business Rules
- 채널 URL은 유효한 URL이어야 한다.
- 동일 채널(유형+URL)은 한 프로필에 중복 불가.
- 프로필 완료 상태는 필수 필드가 충족될 때만 true.

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 입력(생년월일/채널)
FE -> FE: 로컬 검증
FE -> BE: POST /influencer/profile
BE -> Database: UPSERT influencer_profiles
BE -> Database: INSERT/UPDATE influencer_channels
BE --> FE: 200 OK
FE -> User: 완료 메시지/상태 전환
@enduml




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