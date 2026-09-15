# Requirements Traceability ALM Design

## Summary

자동차 OEM 내부의 요구사항 개발·검토·추적성 업무를 지원하는 커스터마이징 가능한 ALM 플랫폼의 첫 MVP를 만든다. 첫 수직 슬라이스는 프로젝트 생성부터 요구사항 작성, 계층·관계 연결, revision/baseline 관리, 추적성 매트릭스 조회, CSV/Excel 입출력까지의 흐름을 로컬에서 완성하는 것이다.

## Product decisions

- 조직 모델은 단일 조직·다중 프로젝트로 시작한다.
- 인증은 Supabase Auth 이메일·비밀번호와 관리자 초대로 시작한다.
- 권한은 Organization Admin, Project Admin, Editor, Reviewer, Viewer의 조직·프로젝트 역할 단위다.
- 작업공간은 왼쪽 계층 트리, 가운데 문서/그리드, 오른쪽 속성·관계·댓글 패널의 혼합형이다.
- 요구사항은 확장 가능한 Work Item 타입으로 저장하며 관리자는 사용자 정의 필드·상태·필수 여부를 설정한다.
- 기본 관계는 parent-child, derives-from, satisfies, refines, conflicts-with이며 프로젝트별 관계 타입을 추가할 수 있다.
- 내부 영구 UUID와 사람이 읽는 문서 번호(예: REQ-0001)를 분리한다.
- 모든 수정과 링크 삭제는 immutable revision/audit event를 생성한다.
- baseline은 각 아이템의 특정 revision 집합을 참조한다.
- 상태는 타입별 전이 규칙을 가지며 전자서명과 정식 승인 게이트는 후속 범위다.
- 댓글·멘션·검토 이력을 지원하되 정식 리뷰 라운드는 후속 범위다.
- 가져오기는 표준 템플릿, 열 매핑, 검증 미리보기를 지원한다. ID가 없으면 신규 생성하고 영구 ID가 있으면 revision을 남기고 갱신한다.
- 삭제는 soft delete이며 과거 baseline과 추적 이력을 보존한다.

## Architecture

Next.js TypeScript 모듈형 모놀리스로 UI와 서버 경계를 한 저장소에 둔다. Supabase Auth, Postgres, Row Level Security, Storage를 사용하고 Vercel 배포를 전제로 한다. 도메인은 프로젝트/권한, work item, 관계, revision/baseline, 검토/가져오기로 분리하며 서버 전용 mutation을 통해 감사 이벤트를 일관되게 만든다.

## Core user flows

1. 조직 관리자가 프로젝트를 만들고 프로젝트 멤버를 초대한다.
2. 프로젝트 관리자가 Work Item 타입, 사용자 정의 필드, 상태 전이, 관계 타입을 설정한다.
3. Editor가 문서 트리에서 요구사항을 생성·편집하고 부모-자식 및 추적 링크를 연결한다.
4. Reviewer가 댓글·멘션을 남기고 상태를 허용된 다음 단계로 변경한다.
5. 사용자가 baseline을 저장하고 revision diff 및 변경 이력을 확인한다.
6. 사용자가 상위/하위 타입을 선택해 커버리지 매트릭스에서 링크 누락을 확인한다.
7. 사용자가 CSV/Excel을 업로드해 매핑·오류를 검토한 뒤 신규 생성 또는 ID 기반 갱신을 실행한다.

## MVP acceptance criteria

- 로컬에서 이메일 로그인, 초대 사용자, 프로젝트 역할별 접근 제어가 동작한다.
- 요구사항을 계층형으로 만들고 문서 번호·상태·사용자 정의 필드를 편집할 수 있다.
- 허용되지 않은 상태 전이와 권한 없는 mutation은 거부된다.
- 요구사항 수정, 관계 생성/삭제, 상태 변경, 댓글 작성이 revision/audit history에 남는다.
- baseline을 생성한 뒤 현재 값과 비교할 수 있고 baseline 시점의 데이터가 보존된다.
- 추적성 매트릭스에서 링크 존재/누락, 관계 타입, 필터를 확인할 수 있다.
- CSV/Excel 열 매핑, 필수값 검증, 오류 행 미리보기, 신규 생성 및 ID 기반 갱신이 동작한다.
- 핵심 도메인 규칙과 RLS 정책에 자동화 테스트가 있고, 주요 화면 흐름은 로컬 브라우저에서 검증된다.

## Out of scope for this MVP

테스트 케이스 실행, 이슈 관리, 전자서명, 정식 리뷰 라운드, SSO, ReqIF 완전 호환, 문서별 권한, 자동 스마트 병합, 외부 Git/CI 통합, Vercel/GitHub 배포 설정은 후속 단계다.
