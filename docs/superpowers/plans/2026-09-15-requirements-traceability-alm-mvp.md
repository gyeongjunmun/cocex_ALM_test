# Requirements Traceability ALM MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally runnable, customizable requirements-management and traceability MVP for an automotive OEM ALM workflow.

**Architecture:** Use a Next.js TypeScript modular monolith with server-side mutations and Supabase Auth/Postgres/RLS. Keep domain modules separate for projects/permissions, work items, relations, revisions/baselines, review, and import/export so later ALM capabilities can reuse the same graph and audit model.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth/Postgres/Row Level Security, Tailwind CSS, shadcn/ui, Vitest, Playwright, ExcelJS or SheetJS for spreadsheet parsing.

**Spec:** `docs/superpowers/specs/2026-09-15-requirements-traceability-alm-design.md`

## Global Constraints

- Support a single organization with multiple projects; do not implement multi-tenant SaaS billing or SSO.
- Use immutable UUIDs for storage and separate human-readable document numbers for display/import/export.
- Every mutation that changes an item, relation, status, or comment must create an audit/revision record.
- Baselines reference item revisions; never overwrite historical baseline state.
- Use soft delete for items and relations.
- Enforce organization/project role access in both server mutations and Supabase RLS.
- Do not add test management, issue management, electronic signatures, formal review rounds, or full ReqIF in this plan.

### Task 1: Create the Next.js application foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `.env.example`
- Test: `tests/smoke/app.spec.ts`

**Interfaces:**
- Produce `createBrowserClient()` and `createServerClient()` wrappers using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produce a protected route layout boundary for authenticated project pages.

- [ ] Scaffold the app with TypeScript, App Router, Tailwind, linting, Vitest, and Playwright.
- [ ] Add the Supabase browser/server client wrappers and environment validation that reports missing variables without leaking secrets.
- [ ] Add a minimal authenticated shell with navigation entries for Projects, Requirements, Traceability, Baselines, and Settings.
- [ ] Write and run the smoke test proving the root route renders the ALM shell.
- [ ] Commit the foundation as `chore: scaffold alm application`.

### Task 2: Add database schema, seed data, and RLS

**Files:**
- Create: `supabase/migrations/0001_core_schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/lib/domain/types.ts`
- Test: `tests/db/core-schema.test.ts`

**Interfaces:**
- Tables: `organizations`, `profiles`, `organization_members`, `projects`, `project_members`, `work_item_types`, `field_definitions`, `workflow_states`, `workflow_transitions`, `documents`, `work_items`, `relation_types`, `work_item_relations`, `revisions`, `revision_changes`, `baselines`, `baseline_items`, `comments`, `audit_events`.
- `work_items` exposes `id`, `project_id`, `document_id`, `type_id`, `parent_id`, `document_number`, `title`, `description`, `status_id`, `deleted_at`, `created_by`, `updated_by`, timestamps.
- Custom fields use `field_definitions` plus typed JSONB values with validation metadata; do not store executable schema.

- [ ] Write schema tests for foreign keys, unique `(project_id, document_number)`, relation self-link rejection, and soft-delete columns.
- [ ] Implement tables, indexes for project/type/status/parent/relation queries, and triggers or server contracts for timestamps.
- [ ] Seed one organization, project, System Requirement and Software Requirement types, basic fields, default workflow states, and default relation types.
- [ ] Add RLS policies for organization membership, project membership, role-based read/write, and reviewer-only review actions.
- [ ] Run the schema tests against the local Supabase database and commit `feat: add core alm schema and policies`.

### Task 3: Implement project setup and role-based access

**Files:**
- Create: `src/lib/domain/permissions.ts`, `src/lib/domain/projects.ts`
- Create: `src/app/(protected)/projects/page.tsx`, `src/app/(protected)/projects/[projectId]/settings/page.tsx`
- Test: `tests/domain/permissions.test.ts`

**Interfaces:**
- `canReadProject(role): boolean`, `canEditProject(role): boolean`, `canReview(role): boolean`, `canConfigureProject(role): boolean`.
- `createProject(input, actor): Promise<Project>` and `inviteProjectMember(input, actor): Promise<void>` must validate actor role and emit audit events.

- [ ] Define the five roles and explicit permission matrix in a failing unit test.
- [ ] Implement permission predicates and server-side project/membership mutations.
- [ ] Build project list, create-project form, member invite form, and role display.
- [ ] Verify RLS rejects cross-project reads and unauthorized writes; commit `feat: add project roles and setup`.

### Task 4: Implement configurable work item types and workflow

**Files:**
- Create: `src/lib/domain/work-item-types.ts`, `src/lib/domain/workflow.ts`
- Create: `src/app/(protected)/projects/[projectId]/settings/types/page.tsx`
- Test: `tests/domain/workflow.test.ts`, `tests/domain/custom-fields.test.ts`

**Interfaces:**
- `createWorkItemType(input, actor): Promise<WorkItemType>`.
- `validateCustomFields(type, values): ValidationResult`.
- `canTransition(fromState, toState, transitions): boolean`.

- [ ] Test required text/number/select/date/boolean custom fields and invalid values.
- [ ] Test allowed and rejected type-specific state transitions.
- [ ] Implement type, field, state, transition, and custom relation-type configuration mutations.
- [ ] Build settings forms that preview field definitions and workflow transitions before saving.
- [ ] Commit `feat: add configurable work item types and workflows`.

### Task 5: Implement requirements document and hybrid workspace

**Files:**
- Create: `src/lib/domain/work-items.ts`, `src/lib/domain/revisions.ts`
- Create: `src/app/(protected)/projects/[projectId]/requirements/page.tsx`, `src/components/requirements/requirement-tree.tsx`, `src/components/requirements/requirement-list.tsx`, `src/components/requirements/detail-panel.tsx`
- Test: `tests/domain/work-items.test.ts`, `tests/e2e/requirements-workspace.spec.ts`

**Interfaces:**
- `createWorkItem(input, actor): Promise<WorkItem>` assigns the next project/document-scoped number and creates revision 1.
- `updateWorkItem(id, patch, actor): Promise<WorkItem>` validates fields/status and appends revision/audit changes.
- `listWorkItems(query): Promise<WorkItemTreePage>` supports document, parent, type, status, owner, tag, changed filters.

- [ ] Write failing tests for numbered creation, nested parent-child items, typed field validation, and revision creation on updates.
- [ ] Implement transactional create/update with document-number allocation and revision/audit records.
- [ ] Build the hybrid workspace: tree navigation, center list/detail editor, right property/relation/comment panel, and document/grid toggle.
- [ ] Add optimistic UI only where rollback is deterministic; show server validation errors inline.
- [ ] Run the browser flow for create, edit, filter, and grid toggle; commit `feat: add hybrid requirements workspace`.

### Task 6: Implement relations and traceability matrix

**Files:**
- Create: `src/lib/domain/relations.ts`, `src/lib/domain/traceability.ts`
- Create: `src/app/(protected)/projects/[projectId]/traceability/page.tsx`, `src/components/traceability/matrix.tsx`
- Test: `tests/domain/relations.test.ts`, `tests/domain/traceability.test.ts`, `tests/e2e/traceability.spec.ts`

**Interfaces:**
- `createRelation(input, actor): Promise<Relation>` and `deleteRelation(id, actor): Promise<void>` reject invalid direction/self-link and write audit events.
- `getTraceabilityMatrix(query): Promise<TraceabilityMatrix>` returns selected row/column items, relation cells, missing-required-link flags, and filter counts.

- [ ] Test parent-child hierarchy, typed links, duplicate rejection, self-link rejection, soft deletion, and baseline preservation.
- [ ] Implement relation mutations and reciprocal display queries.
- [ ] Implement matrix queries for selected item types/documents with status, assignee, tag, changed, and missing-link filters.
- [ ] Build cell-level create/delete actions and clear empty/loading/error states.
- [ ] Verify the coverage scenario from upper requirements to lower requirements; commit `feat: add traceability relations and matrix`.

### Task 7: Implement baselines, diffs, comments, and mentions

**Files:**
- Create: `src/lib/domain/baselines.ts`, `src/lib/domain/comments.ts`
- Create: `src/app/(protected)/projects/[projectId]/baselines/page.tsx`, `src/components/review/comment-thread.tsx`, `src/components/review/revision-timeline.tsx`
- Test: `tests/domain/baselines.test.ts`, `tests/domain/comments.test.ts`, `tests/e2e/review-history.spec.ts`

**Interfaces:**
- `createBaseline(input, actor): Promise<Baseline>` stores item-to-revision references.
- `compareBaseline(baselineId, currentQuery): Promise<BaselineDiff>` reports added/removed/changed items, fields, statuses, and relations.
- `addComment(input, actor): Promise<Comment>` supports item/revision references and validated mention IDs.

- [ ] Test baseline immutability after later edits and relation deletion.
- [ ] Test comment authorization, revision-scoped comments, and mention parsing against project members.
- [ ] Implement baseline creation/list/detail/diff and revision timeline.
- [ ] Build comments and mentions in the right panel; keep formal approval/signature out of scope.
- [ ] Commit `feat: add baselines and review history`.

### Task 8: Implement CSV/Excel import and export

**Files:**
- Create: `src/lib/import-export/columns.ts`, `src/lib/import-export/parse.ts`, `src/lib/import-export/validate.ts`, `src/lib/import-export/execute.ts`
- Create: `src/app/(protected)/projects/[projectId]/import/page.tsx`, `src/app/(protected)/projects/[projectId]/export/route.ts`
- Test: `tests/import-export/parse.test.ts`, `tests/import-export/validate.test.ts`, `tests/import-export/execute.test.ts`

**Interfaces:**
- `parseSpreadsheet(file): Promise<RawRow[]>` supports CSV and XLSX.
- `validateImport(rows, mapping, context): ImportPreview` returns valid rows, errors by row/column, create/update counts.
- `executeImport(preview, actor): Promise<ImportResult>` creates rows without IDs and updates rows with existing UUIDs through normal revision mutations.

- [ ] Test template columns, user mapping, required-field errors, invalid enum values, unknown IDs, and duplicate IDs.
- [ ] Implement parser, mapping preview, validation, and transactional execution with per-row error reporting.
- [ ] Add CSV/XLSX export of current filtered items, relations, status, and document numbers.
- [ ] Verify ID-based updates create revisions and failed rows do not partially mutate their own record.
- [ ] Commit `feat: add spreadsheet import and export`.

### Task 9: Complete acceptance verification and local developer documentation

**Files:**
- Modify: `README.md`, `.env.example`
- Create: `tests/e2e/mvp-acceptance.spec.ts`, `docs/local-development.md`

- [ ] Document Supabase local startup, environment variables, seed/reset commands, test commands, and the planned Vercel deployment variables.
- [ ] Run unit, database/RLS, and Playwright suites from a clean local setup.
- [ ] Verify acceptance flows: login/invite, project roles, configurable type, requirement hierarchy, revision, baseline, traceability matrix, comments, import/export.
- [ ] Record known out-of-scope behavior explicitly and commit `docs: document local setup and mvp verification`.
