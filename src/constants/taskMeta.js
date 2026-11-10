// Board columns, in display order. `color` feeds the --col CSS variable.
export const STATUSES = [
  { id: "TODO", title: "To Do", color: "#64748b" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#3b82f6" },
  { id: "IN_REVIEW", title: "In Review", color: "#8b5cf6" },
  { id: "COMPLETED", title: "Completed", color: "#10b981" },
  { id: "CANCELLED", title: "Cancelled", color: "#f43f5e" },
];

export const PRIORITIES = [
  { id: "LOW", title: "Low", color: "#64748b" },
  { id: "MEDIUM", title: "Medium", color: "#3b82f6" },
  { id: "HIGH", title: "High", color: "#f59e0b" },
  { id: "URGENT", title: "Urgent", color: "#ef4444" },
];

export const statusOf = (id) => STATUSES.find((s) => s.id === id) ?? STATUSES[0];
export const priorityOf = (id) => PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];

// Kinds of work. `icon` is the name of the icon in components/common/Icons.jsx.
export const TYPES = [
  { id: "TASK", title: "Task", color: "#3b82f6", icon: "CheckSquare", hint: "A piece of work to do" },
  { id: "BUG", title: "Bug", color: "#ef4444", icon: "Bug", hint: "Something is broken" },
  { id: "STORY", title: "Story", color: "#10b981", icon: "Bookmark", hint: "A feature, from the user's side" },
];

export const typeOf = (id) => TYPES.find((t) => t.id === id) ?? TYPES[0];
