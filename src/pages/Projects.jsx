import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteProject, listProjects } from "../api/index.js";
import { getTokens } from "../utils/auth.js";
import { firstName, timeAgo } from "../utils/time.js";
import { Clock, Folder, Plus, Search, Sparkles, Trash } from "../components/common/Icons.jsx";
import CountUp from "../components/common/CountUp.jsx";
import AppShell, { projectsChanged } from "../components/layout/AppShell.jsx";
import InvitationsPanel from "../components/projects/InvitationsPanel.jsx";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import ProjectModal from "../components/projects/ProjectModal.jsx";
import useMe from "../hooks/useMe.js";

const LIMIT = 9;
const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

// Numbers for the tiles at the top: they ignore the search and filter below them
async function loadSummary() {
  const [all, active, archived] = await Promise.all([
    listProjects({ pageNo: 1, limit: 50 }),
    listProjects({ pageNo: 1, limit: 1, status: "ACTIVE" }),
    listProjects({ pageNo: 1, limit: 1, status: "ARCHIVED" }),
  ]);
  const latest = (all.data ?? []).reduce(
    (best, p) => (!best || new Date(p.updatedAt) > new Date(best.updatedAt) ? p : best),
    null,
  );
  return {
    total: all.meta?.totalDocuments ?? 0,
    active: active.meta?.totalDocuments ?? 0,
    archived: archived.meta?.totalDocuments ?? 0,
    latest,
  };
}

export default function Projects() {
  const navigate = useNavigate();
  const me = useMe();
  const email = getTokens()?.email ?? "";

  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { project }
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchKey(input.trim());
      setPageNo(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listProjects({ pageNo, limit: LIMIT, status, searchKey });
      setProjects(res.data ?? []);
      setTotal(res.meta?.totalDocuments ?? res.data?.length ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pageNo, status, searchKey]);

  const refreshSummary = useCallback(() => {
    loadSummary().then(setSummary).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { refreshSummary(); }, [refreshSummary]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const reloadAll = () => { load(); refreshSummary(); projectsChanged(); };

  const saved = (message) => {
    setModal(null);
    setToast(message);
    reloadAll();
  };

  const remove = async () => {
    try {
      await deleteProject(confirm._id || confirm.id);
      setConfirm(null);
      setToast("Project deleted");
      refreshSummary();
      projectsChanged();
      // step back a page if that was the last card on it
      if (projects.length === 1 && pageNo > 1) setPageNo(pageNo - 1);
      else load();
    } catch (err) {
      setConfirm(null);
      setError(err.message);
    }
  };

  const openBoard = (project) =>
    navigate(`/tasks/${project._id || project.id}/board`, { state: { name: project.name, myRole: project.myRole } });

  const pages = Math.max(Math.ceil(total / LIMIT), 1);
  const filtering = Boolean(searchKey || status);

  return (
    <AppShell>

      <main className="page">
        <section className="hello">
          <div>
            <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1>{greeting()}, <span className="hl">{firstName(me, email)}</span></h1>
            <p>Pick up where you left off, or start something new.</p>
          </div>
          <button className="btn btn--primary btn--lg magnet" onClick={() => setModal({ project: null })}>
            <Plus width={18} height={18} />New project
          </button>
        </section>

        <section className="tiles" aria-label="Overview">
          <article className="tile spot tilt">
            <span className="tile__icon"><Folder width={19} height={19} /></span>
            <p className="tile__label">Projects</p>
            <strong className="tile__value">{summary ? <CountUp value={summary.total} /> : "–"}</strong>
            <p className="tile__sub">You own or belong to</p>
          </article>
          <article className="tile spot tilt">
            <span className="tile__icon tile__icon--rose"><Clock width={19} height={19} /></span>
            <p className="tile__label">Last updated</p>
            <strong className="tile__value">{summary?.latest ? timeAgo(summary.latest.updatedAt) : "–"}</strong>
            {summary?.latest
              ? <button type="button" className="tile__link" onClick={() => openBoard(summary.latest)}>{summary.latest.name}</button>
              : <p className="tile__sub">No projects yet</p>}
          </article>
          <article className="tile spot tilt">
            <span className="tile__icon tile__icon--sky"><Sparkles width={19} height={19} /></span>
            <p className="tile__label">Active</p>
            <strong className="tile__value">{summary ? <CountUp value={summary.active} /> : "–"}</strong>
            <p className="tile__sub">
              {summary ? `${summary.archived} archived` : " "}
            </p>
          </article>
        </section>

        <InvitationsPanel onAccepted={reloadAll} onMessage={setToast} />

        <section className="section-head">
          <h2>My projects{total > 0 && <span className="count">{total}</span>}</h2>
          <div className="toolbar">
            <label className="search">
              <Search width={17} height={17} />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search projects…" aria-label="Search projects" />
            </label>
            <div className="seg" role="tablist" aria-label="Filter projects">
              {FILTERS.map((f) => (
                <button key={f.label} role="tab" aria-selected={status === f.value}
                  className={status === f.value ? "is-on" : ""}
                  onClick={() => { setStatus(f.value); setPageNo(1); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && <p className="notice notice--error">{error}</p>}

        {loading && projects.length === 0 ? (
          <div className="grid">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty">
            <span><Folder width={28} height={28} /></span>
            <h3>{filtering ? "No matching projects" : "No projects yet"}</h3>
            <p>{filtering ? "Try a different search or filter." : "Create your first project to get started."}</p>
            {!filtering && (
              <button className="btn btn--primary" onClick={() => setModal({ project: null })}>
                <Plus width={18} height={18} />New project
              </button>
            )}
          </div>
        ) : (
          <div className={`grid ${loading ? "is-loading" : ""}`}>
            {projects.map((p, i) => (
              <ProjectCard key={p._id || p.id} project={p} index={i}
                onEdit={(project) => setModal({ project })}
                onDelete={setConfirm} />
            ))}
            {!filtering && pageNo === pages && (
              <button type="button" className="card card--new spot" style={{ "--i": projects.length }} onClick={() => setModal({ project: null })}>
                <span><Plus width={22} height={22} /></span>
                <strong>New project</strong>
                <small>Set up a board, invite your team</small>
              </button>
            )}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <button className="btn btn--ghost btn--sm" disabled={pageNo === 1} onClick={() => setPageNo(pageNo - 1)}>Previous</button>
            <span>Page {pageNo} of {pages}</span>
            <button className="btn btn--ghost btn--sm" disabled={pageNo === pages} onClick={() => setPageNo(pageNo + 1)}>Next</button>
          </nav>
        )}
      </main>

      {modal && <ProjectModal project={modal.project} onClose={() => setModal(null)} onSaved={saved} />}

      {confirm && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal modal--sm modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="modal__body">
              <span className="confirm__icon"><Trash width={22} height={22} /></span>
              <h2 id="confirm-title">Delete “{confirm.name}”?</h2>
              <p className="hint">Its tasks will be cancelled and members will lose access. This can't be undone.</p>
            </div>
            <footer>
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={remove}>Delete project</button>
            </footer>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </AppShell>
  );
}
