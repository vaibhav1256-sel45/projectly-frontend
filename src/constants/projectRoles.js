// What a member is called in a project, and what each role includes.
// Viewing comes with every role.
export const PROJECT_ROLES = [
  { id: "VIEWER", title: "Viewer", color: "#64748b", can: ["View"] },
  { id: "EDITOR", title: "Editor", color: "#3b82f6", can: ["View", "Edit"] },
  { id: "DELETOR", title: "DELETOR", color: "#f59e0b", can: ["View", "Delete"] },
  { id: "ADMIN", title: "Admin", color: "#10b981", can: ["View", "Edit", "Delete"] },
];

export const DEFAULT_ROLE = "EDITOR";
export const roleOf = (id) => PROJECT_ROLES.find((r) => r.id === id) ?? PROJECT_ROLES[1];
// "Owner" for the project owner, otherwise the role's name
export const roleLabel = (id) => (id === "OWNER" ? "Owner" : roleOf(id).title);

// What the current user's role (myRole in the project list) allows. The server enforces the same rules.
export const canEdit = (role) => role === "EDITOR" || role === "ADMIN";
export const canDelete = (role) => role === "DELETOR" || role === "ADMIN";
export const canManageMembers = (role) => role === "ADMIN";
