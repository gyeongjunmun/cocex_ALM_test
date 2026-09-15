export type ProjectRole = "organization_admin" | "project_admin" | "editor" | "reviewer" | "viewer";
export type FieldType = "text" | "long_text" | "number" | "select" | "date" | "boolean";

export interface WorkItemType { id: string; projectId: string; name: string; key: string; }
export interface WorkItem { id: string; projectId: string; documentId: string; typeId: string; statusId: string; parentId: string | null; documentNumber: string; title: string; description: string; customFields: Record<string, unknown>; deletedAt: string | null; }
export interface Relation { id: string; projectId: string; relationTypeId: string; sourceItemId: string; targetItemId: string; deletedAt: string | null; }
export interface Baseline { id: string; projectId: string; name: string; description: string; createdAt: string; }
