import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getProjectStats } from "../api/index.js";
import { PRIORITIES, STATUSES, priorityOf, statusOf } from "../constants/taskMeta.js";
import { Alert, BarChart, Calendar, Check, Clock, Refresh } from "../components/common/Icons.jsx";
import UserAvatar from "../components/common/UserAvatar.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import ProjectHeader from "../components/layout/ProjectHeader.jsx";
import useProject from "../hooks/useProject.js";
import { BarRows, Meter, StatTile, Tip, useTip } from "../components/dashboard/charts.jsx";
import CountUp from "../components/common/CountUp.jsx";

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

export default function Dashboard() {
  const { projectId } = useParams();
  const { state } = useLocation();
  const { name: projectName } = useProject(projectId, state);
  const tip = useTip();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("charts"); // charts | table

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats((await getProjectStats(projectId)).data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);


  const count = (status) => stats?.byStatus.find((s) => s.status === status)?.count ?? 0;
  const total = stats?.total ?? 0;
  const done = count("COMPLETED");
  const counted = total - count("CANCELLED");

  const statusRows = (stats?.byStatus ?? []).map((s) => ({
    key: s.status, label: statusOf(s.status).title, value: s.count, color: statusOf(s.status).color,
    note: `${pct(s.count, total)}% of all tasks`,
  }));
  const priorityRows = (stats?.byPriority ?? []).map((p) => ({
    key: p.priority, label: priorityOf(p.priority).title, value: p.count, color: priorityOf(p.priority).color,
  }));
  const openTotal = (stats?.workload ?? []).reduce((sum, w) => sum + w.openTasks, 0);
  const workloadRows = (stats?.workload ?? []).map((w, i) => ({
    key: w.user?._id ?? `none-${i}`,
    label: w.user ? w.user.name || "Unknown user" : "Unassigned",
    lead: w.user ? <UserAvatar user={w.user} size={24} /> : <span className="uavatar uavatar--empty">—</span>,
    value: w.openTasks,
    color: w.user ? "var(--accent-strong)" : "var(--muted)",
    note: [w.user?.email, `${pct(w.openTasks, openTotal)}% of open tasks`].filter(Boolean).join(" · "),
  }));

  return (
    <AppShell>

      <main className="page">
        <ProjectHeader projectId={projectId} state={state} name={projectName} meta="How the work is going, and who is carrying what.">
          <div className="seg" role="tablist" aria-label="View">
            <button className={view === "charts" ? "is-on" : ""} onClick={() => setView("charts")}>Charts</button>
            <button className={view === "table" ? "is-on" : ""} onClick={() => setView("table")}>Table</button>
          </div>
          <button className="icon-btn btn--ghost" onClick={load} aria-label="Refresh" title="Refresh"><Refresh /></button>
        </ProjectHeader>

        {error && <p className="notice notice--error"><Alert width={16} height={16} />{error}</p>}
        {!stats && loading && <p className="hint">Loading statistics…</p>}

        {stats && total === 0 && (
          <div className="dash__empty">
            <BarChart width={28} height={28} />
            <strong>No tasks yet</strong>
            <span>Create a few tasks on the board and the numbers will show up here.</span>
            <Link to={`/tasks/${projectId}/board`} state={state} className="btn btn--primary">Go to board</Link>
          </div>
        )}

        {stats && total > 0 && (
          <div className={`dash ${loading ? "is-loading" : ""}`}>
            {/* ---------- headline numbers ---------- */}
            <section className="dash__kpis" aria-label="Headline numbers">
              <article className="stat stat--hero spot tilt" data-tilt="3">
                <p className="stat__label"><Check width={16} height={16} />Completion</p>
                <strong className="stat__hero"><CountUp value={stats.completionRate} /><span>%</span></strong>
                <Meter percent={stats.completionRate} label="Completion" />
                <small className="stat__note">{done} of {counted} tasks completed · cancelled tasks not counted</small>
              </article>
              <StatTile icon={BarChart} label="Total tasks" value={total} note={`${counted - done} still open or in review`} />
              <StatTile icon={stats.overdue ? Alert : Check} label="Overdue" value={stats.overdue} tone={stats.overdue ? "bad" : "good"}
                note={stats.overdue ? "Open tasks past their due date" : "Nothing is late"} />
              <StatTile icon={Calendar} label="Due in 7 days" value={stats.dueSoon} note="Open tasks with a due date this week" />
              <StatTile icon={Clock} label="Completed this week" value={stats.completedLast7Days} note="Marked completed in the last 7 days" />
            </section>

            {view === "charts" ? (
              <div className="dash__grid">
                <section className="panel spot">
                  <h2>Tasks by status</h2>
                  <p className="panel__sub">All {total} tasks</p>
                  <BarRows rows={statusRows} tip={tip} />
                </section>
                <section className="panel spot">
                  <h2>Open tasks by priority</h2>
                  <p className="panel__sub">To Do, In Progress and In Review</p>
                  <BarRows rows={priorityRows} tip={tip} />
                </section>
                <section className="panel panel--wide spot">
                  <h2>Workload</h2>
                  <p className="panel__sub">Open tasks per person</p>
                  <BarRows rows={workloadRows} tip={tip} empty="No open tasks right now." />
                </section>
              </div>
            ) : (
              <div className="dash__grid">
                <section className="panel spot">
                  <h2>Tasks by status</h2>
                  <table className="dtable"><thead><tr><th>Status</th><th>Tasks</th><th>Share</th></tr></thead>
                    <tbody>{statusRows.map((r) => <tr key={r.key}><td>{r.label}</td><td>{r.value}</td><td>{pct(r.value, total)}%</td></tr>)}</tbody></table>
                </section>
                <section className="panel spot">
                  <h2>Open tasks by priority</h2>
                  <table className="dtable"><thead><tr><th>Priority</th><th>Open tasks</th></tr></thead>
                    <tbody>{priorityRows.map((r) => <tr key={r.key}><td>{r.label}</td><td>{r.value}</td></tr>)}</tbody></table>
                </section>
                <section className="panel panel--wide spot">
                  <h2>Workload</h2>
                  <table className="dtable"><thead><tr><th>Person</th><th>Open tasks</th><th>Share</th></tr></thead>
                    <tbody>{workloadRows.map((r) => <tr key={r.key}><td>{r.label}</td><td>{r.value}</td><td>{pct(r.value, openTotal)}%</td></tr>)}</tbody></table>
                </section>
              </div>
            )}
          </div>
        )}
      </main>
      <Tip tip={tip.tip} />
    </AppShell>
  );
}
