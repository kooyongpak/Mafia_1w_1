## 003. 광고주 정보 등록

- Primary Actor: 로그인한 광고주(role=advertiser)
- Precondition: 사용자 계정이 존재하며 로그인 상태
- Trigger: 광고주 등록 폼 제출

### Main Scenario
1. FE가 업체명/위치/카테고리/사업자등록번호 입력을 검증한다.
2. FE가 BE에 프로필 저장 요청을 보낸다.
3. BE는 `advertiser_profiles`를 upsert하고 중복 사업자번호를 가드한다.
4. BE는 성공 응답을 반환한다.
5. FE는 체험단 관리 화면으로 전환한다.

### Edge Cases
- 사업자등록번호 중복 → 409
- 필수값 누락 → 400
- 인증 만료 → 401

### Business Rules
- 사업자등록번호는 유일해야 한다.
- 프로필 완료 상태는 필수 필드 충족 시 true.

### Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 입력(업체/위치/카테고리/사업자번호)
FE -> FE: 로컬 검증
FE -> BE: POST /advertiser/profile
BE -> Database: UPSERT advertiser_profiles
BE --> FE: 200 OK
FE -> User: 관리 화면으로 이동
@enduml




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