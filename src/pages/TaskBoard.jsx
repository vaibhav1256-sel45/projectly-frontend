import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { listProjectMembers, listTasks, updateTask } from "../api/index.js";
import { PRIORITIES, STATUSES, priorityOf } from "../constants/taskMeta.js";
import { Alert, Calendar, Filter, Flag, Lock, Plus, Refresh, Search, Sparkles, User } from "../components/common/Icons.jsx";
import TaskModal from "../components/tasks/TaskModal.jsx";
import AiTasksModal from "../components/tasks/AiTasksModal.jsx";
import UserAvatar from "../components/common/UserAvatar.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import ProjectHeader from "../components/layout/ProjectHeader.jsx";
import { canDelete, canEdit, roleLabel } from "../constants/projectRoles.js";
import Dropdown from "../components/common/Dropdown.jsx";
import TypeIcon from "../components/tasks/TypeIcon.jsx";
import useProject from "../hooks/useProject.js";

const LIMIT = 100;
const STATUS_HINTS = {
  TODO: "Not started yet",
  IN_PROGRESS: "Someone is on it",
  IN_REVIEW: "Waiting for a review",
  COMPLETED: "Done and dusted",
  CANCELLED: "Locked, read-only",
};
const emptyColumns = () => Object.fromEntries(STATUSES.map((s) => [s.id, []]));

const group = (tasks) => {
  const cols = emptyColumns();
  tasks.forEach((t) => (cols[t.status] ?? cols.TODO).push(t));
  return cols;
};

const formatDue = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const isOverdue = (t) =>
  t.dueDate && t.status !== "COMPLETED" && t.status !== "CANCELLED" && new Date(t.dueDate) < new Date(new Date().toDateString());

// The API gives the full user when it can resolve it, otherwise just the id. Fall back to the project members.
const assigneeOf = (task, members) => {
  if (!task.assignee) return null;
  const member = members.find((m) => String(m._id) === String(task.assignee._id));
  return { ...member, ...task.assignee };
};

export default function TaskBoard() {
  const { projectId } = useParams();
  const { state } = useLocation();
  const { name: projectName, myRole } = useProject(projectId, state);

  const [columns, setColumns] = useState(emptyColumns);
  const [members, setMembers] = useState([]);
  const [membersState, setMembersState] = useState("loading"); // loading | ready | error
  const [total, setTotal] = useState(0);
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignees, setAssignees] = useState([]); // user ids and/or "unassigned"
  const [showAllPeople, setShowAllPeople] = useState(false);
  const [input, setInput] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { task, status }
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [toast, setToast] = useState(null); // { text, kind }

  useEffect(() => {
    const t = setTimeout(() => setSearchKey(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const res = await listTasks({ projectId, limit: LIMIT, status, priority, searchKey, assignee: assignees.join(",") });
      const tasks = res.data ?? [];
      setColumns(group(tasks));
      setTotal(res.meta?.totalDocuments ?? tasks.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, status, priority, searchKey, assignees]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let alive = true;
    setMembersState("loading");
    listProjectMembers(projectId)
      .then((res) => { if (alive) { setMembers(res.data ?? []); setMembersState("ready"); } })
      .catch(() => alive && setMembersState("error"));
    return () => { alive = false; };
  }, [projectId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (text, kind = "ok") => setToast({ text, kind });

  const move = async (draggableId, from, to, index) => {
    const prev = columns;
    const source = [...prev[from]];
    const [task] = source.splice(source.findIndex((t) => t._id === draggableId), 1);
    const dest = from === to ? source : [...prev[to]];
    dest.splice(index, 0, { ...task, status: to });
    setColumns({ ...prev, [from]: source, [to]: dest });
    if (from === to) return; // the order inside a column is not stored, so there is nothing to save

    try {
      await updateTask(draggableId, { status: to });
    } catch (err) {
      setColumns(prev); // roll the card back and show the server's reason
      notify(err.message, "error");
      load({ quiet: true });
    }
  };

  const onDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    const from = source.droppableId;
    const to = destination.droppableId;
    if (from === to && source.index === destination.index) return;
    if (from === "CANCELLED") return; // cancelled tasks are locked

    if (to === "CANCELLED") {
      if (!canDelete(columns[from][source.index]?.myRole)) {
        notify("You can only cancel tasks you created", "error");
        return;
      }
      setPendingCancel({ id: draggableId, from, index: destination.index, title: columns[from][source.index]?.title });
      return;
    }
    move(draggableId, from, to, destination.index);
  };

  const saved = (text) => { setModal(null); notify(text); load({ quiet: true }); };


  const done = columns.COMPLETED.length;
  const active = total - columns.CANCELLED.length;
  const progress = active > 0 ? Math.round((done / active) * 100) : 0;
  const filtered = Boolean(status || priority || searchKey || assignees.length);
  const toggleAssignee = (id) =>
    setAssignees((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const PEOPLE_SHOWN = 6;
  const visiblePeople = showAllPeople ? members : members.slice(0, PEOPLE_SHOWN);

  const stats = useMemo(
    () => STATUSES.map((s) => ({ ...s, count: columns[s.id].length })),
    [columns],
  );

  return (
    <AppShell>

      <main className="page page--board">
        <ProjectHeader projectId={projectId} state={state} name={projectName}
          meta={(
            <>
              <span>{total} {total === 1 ? "task" : "tasks"}</span>
              <span className="progress" role="img" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></span>
              <span>{progress}% complete</span>
            </>
          )}>
          {canEdit(myRole) && (
            <>
              <button className="btn btn--ghost" onClick={() => setAiOpen(true)}>
                <Sparkles width={18} height={18} />Generate with AI
              </button>
              <button className="btn btn--primary magnet" onClick={() => setModal({ task: null, status: "TODO" })}>
                <Plus width={18} height={18} />New task
              </button>
            </>
          )}
        </ProjectHeader>

        <section className="toolbar">
          <label className="search">
            <Search width={18} height={18} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search tasks…" />
          </label>
          <Dropdown label="Filter by status" heading="Show tasks that are…" icon={Filter} value={status} onChange={setStatus}
            options={[
              { value: "", label: "All statuses" },
              ...STATUSES.map((st) => ({
                value: st.id, label: st.title, color: st.color, hint: STATUS_HINTS[st.id],
              })),
            ]} />
          <Dropdown label="Filter by priority" heading="Show priority" icon={Flag} value={priority} onChange={setPriority}
            options={[
              { value: "", label: "All priorities" },
              ...PRIORITIES.map((p) => ({ value: p.id, label: p.title, color: p.color })),
            ]} />
          {(members.length > 0 || membersState === "ready") && (
            <section className="people" aria-label="Filter by assignee">
              <div className="people__stack">
                {visiblePeople.map((m) => {
                  const id = String(m._id);
                  const on = assignees.includes(id);
                  return (
                    <button key={id} type="button" className={`people__item ${on ? "is-on" : ""}`}
                      onClick={() => toggleAssignee(id)} aria-pressed={on}
                      title={`${m.name || "Unknown user"} · ${roleLabel(m.role)}`}>
                      <UserAvatar user={m} size={36} />
                    </button>
                  );
                })}
                {members.length > PEOPLE_SHOWN && (
                  <button type="button" className="people__more" onClick={() => setShowAllPeople((v) => !v)}>
                    {showAllPeople ? "Less" : `+${members.length - PEOPLE_SHOWN}`}
                  </button>
                )}
              </div>
              <button type="button" className={`people__unassigned ${assignees.includes("unassigned") ? "is-on" : ""}`}
                onClick={() => toggleAssignee("unassigned")} aria-pressed={assignees.includes("unassigned")}>
                <User width={15} height={15} />Unassigned
              </button>
              {assignees.length > 0 && (
                <button type="button" className="people__clear" onClick={() => setAssignees([])}>Clear</button>
              )}
            </section>
          )}
          <button className="icon-btn btn--ghost" onClick={() => load()} aria-label="Refresh" title="Refresh"><Refresh /></button>
        </section>

        {error && <p className="notice notice--error">{error}</p>}
        {total > LIMIT && <p className="notice notice--warn"><Alert width={16} height={16} />Showing the first {LIMIT} of {total} tasks. Use search or filters to narrow down.</p>}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className={`board ${status ? "board--single" : ""}`}>
            {stats.filter((c) => !status || c.id === status).map((col) => (
              <section key={col.id} className="col" style={{ "--col": col.color }}>
                <header className="col__head">
                  <span className="col__dot" />
                  <h3>{col.title}</h3>
                  <span className="col__count" key={col.count}>{col.count}</span>
                  {col.id !== "CANCELLED" && canEdit(myRole) && (
                    <button className="icon-btn" aria-label={`Add task to ${col.title}`} title="Add task"
                      onClick={() => setModal({ task: null, status: col.id })}><Plus width={17} height={17} /></button>
                  )}
                </header>

                <Droppable droppableId={col.id}>
                  {(provided, snap) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`col__list ${snap.isDraggingOver ? "is-over" : ""}`}>
                      {loading
                        ? [0, 1].map((i) => <div key={i} className="tskeleton" />)
                        : columns[col.id].map((task, index) => {
                            const locked = task.status === "CANCELLED";
                            const due = isOverdue(task);
                            const prio = priorityOf(task.priority);
                            const person = assigneeOf(task, members);
                            return (
                              <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={locked || !(canEdit(task.myRole) || canDelete(task.myRole))}>
                                {(drag, s) => (
                                  <article ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                                    className={`task spot ${s.isDragging ? "is-dragging" : ""} ${locked ? "is-locked" : ""}`}
                                    style={{ ...drag.draggableProps.style, "--i": Math.min(index, 8) }}
                                    onClick={() => setModal({ task, status: task.status })}>
                                    <h4>{task.title}</h4>
                                    {task.description && <p>{task.description}</p>}
                                    <footer>
                                      <span className="task__id">
                                        <TypeIcon type={task.type} size={16} />
                                        #{String(task._id).slice(-4).toUpperCase()}
                                        {locked && <Lock width={12} height={12} className="task__lock" />}
                                      </span>
                                      <span className={`pbar pbar--${task.priority?.toLowerCase()}`} style={{ "--c": prio.color }}
                                        title={`${prio.title} priority`} aria-label={`${prio.title} priority`}>
                                        <i /><i /><i />
                                      </span>
                                      {task.dueDate && (
                                        <span className={`due ${due ? "is-late" : ""}`}><Calendar width={12} height={12} />{formatDue(task.dueDate)}</span>
                                      )}
                                      <span className="task__who" title={person ? person.name : "Unassigned"}>
                                        {person ? <UserAvatar user={person} size={22} /> : <span className="uavatar uavatar--empty"><User width={11} height={11} /></span>}
                                      </span>
                                    </footer>
                                  </article>
                                )}
                              </Draggable>
                            );
                          })}
                      {provided.placeholder}
                      {!loading && columns[col.id].length === 0 && (
                        <p className="col__empty">{filtered ? "No matches" : col.id === "CANCELLED" ? "Nothing cancelled" : "Drop tasks here"}</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </section>
            ))}
          </div>
        </DragDropContext>
      </main>

      {modal && (
        <TaskModal task={modal.task} projectId={projectId} defaultStatus={modal.status}
          members={members}
          onClose={() => setModal(null)} onSaved={saved} />
      )}

      {aiOpen && (
        <AiTasksModal projectId={projectId} onClose={() => setAiOpen(false)}
          onSaved={(text) => { setAiOpen(false); notify(text); load({ quiet: true }); }} />
      )}

      {pendingCancel && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setPendingCancel(null)}>
          <div className="modal modal--sm" role="alertdialog" aria-modal="true">
            <div className="modal__body">
              <h2>Cancel “{pendingCancel.title}”?</h2>
              <p className="hint">Cancelled tasks are locked and can no longer be edited or moved.</p>
            </div>
            <footer>
              <button className="btn btn--ghost" onClick={() => setPendingCancel(null)}>Keep task</button>
              <button className="btn btn--danger" onClick={() => {
                const p = pendingCancel;
                setPendingCancel(null);
                move(p.id, p.from, "CANCELLED", p.index);
              }}>Cancel task</button>
            </footer>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.kind === "error" ? "toast--error" : ""}`} role="status" key={toast.text}>{toast.text}</div>}
    </AppShell>
  );
}
