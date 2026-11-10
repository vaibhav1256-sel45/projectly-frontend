import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { listProjects, logout as endSession } from "../../api/index.js";
import { clearTokens, getTokens } from "../../utils/auth.js";
import { BarChart, Chevron, Close, Columns, Folder, Logo, Logout, Menu } from "../common/Icons.jsx";
import UserAvatar from "../common/UserAvatar.jsx";
import useMe from "../../hooks/useMe.js";
import useViewUrl from "../../hooks/useViewUrl.js";

const COLLAPSE_KEY = "sidebar-collapsed";
const SIDEBAR_LIMIT = 8;

const readCollapsed = () => {
  try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
};

// Pages call this after creating, editing or deleting a project, so the sidebar list stays current
export const projectsChanged = () => window.dispatchEvent(new Event("projects:changed"));

function ProjectLink({ project, active }) {
  const id = project._id || project.id;
  const cover = useViewUrl(project.coverImage);
  const state = { name: project.name, myRole: project.myRole };
  return (
    <li className={active ? "is-active" : ""}>
      <Link to={`/tasks/${id}/board`} state={state} className="side__project" title={project.name}>
        <span className="side__thumb" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
          {!cover && project.name?.[0]?.toUpperCase()}
        </span>
        <span className="side__label">{project.name}</span>
      </Link>
      {active && (
        <div className="side__sub">
          <NavLink to={`/tasks/${id}/board`} state={state}><Columns width={15} height={15} /><span>Board</span></NavLink>
          <NavLink to={`/tasks/${id}/dashboard`} state={state}><BarChart width={15} height={15} /><span>Dashboard</span></NavLink>
        </div>
      )}
    </li>
  );
}

// The frame of every signed-in page: sidebar on the left, the page on the right
export default function AppShell({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const me = useMe();
  const email = getTokens()?.email ?? "";
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);

  // page 1 replaces the list, later pages ("Show more") add to it
  const load = useCallback((pageNo) => {
    listProjects({ pageNo, limit: SIDEBAR_LIMIT, status: "ACTIVE" })
      .then((res) => {
        const list = res.data ?? [];
        setProjects((prev) => (pageNo === 1 ? list : [...prev, ...list]));
        setTotal(res.meta?.totalDocuments ?? 0);
        setPage(pageNo);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const reload = () => load(1);
    reload();
    window.addEventListener("projects:changed", reload);
    return () => window.removeEventListener("projects:changed", reload);
  }, [load]);

  useEffect(() => setDrawer(false), [pathname]);

  const toggle = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* just won't be remembered */ }
    return !c;
  });

  const logout = async () => {
    await endSession().catch(() => {}); // the browser logs out even if the server can't be reached
    clearTokens();
    navigate("/login", { replace: true });
  };

  const currentId = pathname.match(/^\/tasks\/([^/]+)/)?.[1];

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""}`}>
      <header className="shell__bar">
        <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu /></button>
        <Link to="/" className="brand"><span className="brand__mark"><Logo /></span>Projectly</Link>
      </header>
      {drawer && <div className="shell__scrim" onClick={() => setDrawer(false)} />}

      <aside className={`side ${drawer ? "is-open" : ""}`}>
        <div className="side__top">
          <Link to="/" className="brand" title="Projectly"><span className="brand__mark"><Logo /></span><span className="side__label">Projectly</span></Link>
          <button className="icon-btn side__collapse" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand" : "Collapse"}>
            <Chevron width={17} height={17} />
          </button>
          <button className="icon-btn side__close" onClick={() => setDrawer(false)} aria-label="Close menu"><Close /></button>
        </div>

        <nav className="side__nav" aria-label="Main">
          <NavLink to="/" end className="side__item" title="All projects">
            <Folder width={18} height={18} /><span className="side__label">All projects</span>
          </NavLink>

          {projects.length > 0 && <p className="side__heading side__label">Active projects<span className="side__count">{total}</span></p>}
          <ul className="side__projects">
            {projects.map((p) => <ProjectLink key={p._id || p.id} project={p} active={String(p._id || p.id) === currentId} />)}
          </ul>
          {projects.length < total && (
            <button type="button" className="side__more side__label" onClick={() => load(page + 1)}>
              Show {Math.min(SIDEBAR_LIMIT, total - projects.length)} more
            </button>
          )}
        </nav>

        <div className="side__foot">
          <div className="side__user">
            <UserAvatar user={me ?? { name: email }} size={34} />
            <span className="side__who side__label"><strong>{me?.name || email}</strong><small>{me?.email || email}</small></span>
            <button className="icon-btn side__logout" onClick={logout} aria-label="Log out" title="Log out"><Logout width={17} height={17} /></button>
          </div>
        </div>
      </aside>

      <div className="shell__main">{children}</div>
    </div>
  );
}
