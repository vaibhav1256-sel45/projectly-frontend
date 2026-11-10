const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const icon = (paths) => (props) => <svg {...base} {...props}>{paths}</svg>;

export const Plus = icon(<path d="M12 5v14M5 12h14" />);
export const Search = icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const Camera = icon(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>);
export const Image = icon(<><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-9 9" /></>);
export const Close = icon(<path d="M6 6l12 12M18 6 6 18" />);
export const Trash = icon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const Edit = icon(<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />);
export const Logout = icon(<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />);
export const Users = icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.2 3.2 0 0 1 0 6M21 20c0-2.6-1.6-4.8-4-5.6" /></>);
export const Folder = icon(<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />);
export const Check = icon(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const Mail = icon(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 8 8 6 8-6" /></>);
export const Lock = icon(<><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const User = icon(<><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>);
export const ArrowLeft = icon(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const Calendar = icon(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>);
export const Refresh = icon(<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />);
export const Alert = icon(<><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17.5v.01" /></>);

// Brand mark: three kanban cards, each a little shorter than the last (drawn in currentColor)
export const Logo = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="2.5" y="3" width="5" height="18" rx="2" fill="currentColor" />
    <rect x="9.5" y="3" width="5" height="12" rx="2" fill="currentColor" opacity="0.75" />
    <rect x="16.5" y="3" width="5" height="7" rx="2" fill="currentColor" opacity="0.5" />
  </svg>
);

export const Chevron = icon(<path d="m6 9 6 6 6-6" />);
export const MessageSquare = icon(<path d="M4 5h16v11H9l-5 4z" />);

export const Paperclip = icon(<path d="m20 11-8.6 8.6a5 5 0 0 1-7-7L13 4a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6L14 7.5" />);
export const FileIcon = icon(<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></>);
export const ExternalLink = icon(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const UploadCloud = icon(<><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5a4.2 4.2 0 0 1-.5 8.5" /><path d="M12 12v8M9 15l3-3 3 3" /></>);
export const BarChart = icon(<path d="M5 20v-8M12 20V4M19 20v-5" />);
export const Clock = icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const Eye = icon(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>);
export const Columns = icon(<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M15 4v16" /></>);
export const Sparkles = icon(<path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.7l-1.6-5.5L5 10.6 10.4 9zM19 15.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" />);
export const Filter = icon(<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" />);
export const Bug = icon(<><rect x="7" y="7" width="10" height="13" rx="5" /><path d="M9.5 7a2.5 2.5 0 0 1 5 0M12 11v9M3 13h4M17 13h4M4 7.5 7 9M20 7.5 17 9M4 19l3-2M20 19l-3-2" /></>);
export const Bookmark = icon(<path d="M6 4h12v16l-6-4-6 4z" />);
export const CheckSquare = icon(<><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></>);
export const Menu = icon(<path d="M4 7h16M4 12h16M4 17h16" />);
export const Flag = icon(<path d="M6 21V4h12l-2.5 4 2.5 4H6" />);
