import { useEffect, useRef, useState } from "react";
import { createTask, deleteStoredFile, updateTask } from "../../api/index.js";
import { findMentionedIds } from "../../utils/mentions.js";
import { PRIORITIES, STATUSES, TYPES, statusOf, typeOf } from "../../constants/taskMeta.js";
import { Alert, Calendar, Check, Close, Lock, MessageSquare } from "../common/Icons.jsx";
import TaskComments from "./TaskComments.jsx";
import TaskHistory from "./TaskHistory.jsx";
import TaskAttachments from "./TaskAttachments.jsx";
import useMe from "../../hooks/useMe.js";
import MentionText from "../common/MentionText.jsx";
import MentionTextarea from "../common/MentionTextarea.jsx";
import { OptionPicker, PersonPicker } from "./Pickers.jsx";
import TypeIcon from "./TypeIcon.jsx";
import { canDelete, canEdit } from "../../constants/projectRoles.js";

const FLOW = STATUSES.filter((st) => st.id !== "CANCELLED");

// "in 2 days", "due today", "3 days overdue" for the due-date field
const dueHint = (iso, status) => {
  if (!iso) return null;
  const days = Math.round((new Date(iso) - new Date(new Date().toDateString())) / 86400000);
  const done = status === "COMPLETED" || status === "CANCELLED";
  if (days === 0) return { text: "Due today", tone: done ? "" : "warn" };
  if (days === 1) return { text: "Due tomorrow", tone: "" };
  if (days > 1) return { text: `Due in ${days} days`, tone: "" };
  return { text: `${-days} day${days === -1 ? "" : "s"} overdue`, tone: done ? "" : "late" };
};

// Create when `task` is null, edit otherwise. A cancelled task opens read-only.
export default function TaskModal({ task, projectId, defaultStatus = "TODO", members = [], onClose: closeModal, onSaved }) {
  const editing = Boolean(task);
  const locked = task?.status === "CANCELLED";
  // A new task can't start out cancelled (e.g. the "+" on the Cancelled column) — it opens as To Do.
  const initialStatus = task?.status ?? (defaultStatus === "CANCELLED" ? "TODO" : defaultStatus);

  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: initialStatus,
    priority: task?.priority ?? "MEDIUM",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    type: task?.type ?? "TASK",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Files are uploaded to S3 when picked but only saved on the task by "Save changes".
  // Closing without saving deletes the ones that were never saved.
  const [attachments, setAttachments] = useState(task?.attachments ?? []);
  const onClose = () => {
    attachments.filter((a) => a.pending).forEach((a) => deleteStoredFile(a.key));
    closeModal();
  };
  const me = useMe();
  // task.myRole is the project role, or ADMIN for whoever created the task
  const mayEdit = !editing || canEdit(task.myRole);
  const mayCancel = editing && canDelete(task.myRole);

  // the people on the task; full user objects so the pickers can show them
  const fromMembers = (user) => (user?._id ? { ...members.find((m) => String(m._id) === String(user._id)), ...user } : null);
  const [assignee, setAssignee] = useState(() => fromMembers(task?.assignee));
  const [reporter, setReporter] = useState(() => fromMembers(task?.reporter));
  const meId = me?._id ?? me?.id;
  // a new task is reported by whoever creates it, unless they pick someone else
  useEffect(() => {
    if (!editing && !reporter && me) setReporter(me);
  }, [editing, reporter, me]);

  // an existing task shows its description as text (mentions highlighted); click to edit
  const [descOpen, setDescOpen] = useState(false);
  const [tab, setTab] = useState("comments"); // comments | history

  useEffect(() => {
    // pickers stop their own Esc, so this only fires when no dropdown is open
    const onKey = (e) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const becomingCancelled = editing && !locked && form.status === "CANCELLED" && task.status !== "CANCELLED";

  const current = {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    type: form.type,
    assignee: assignee?._id ? String(assignee._id) : null,
    reporter: reporter?._id ? String(reporter._id) : null,
    dueDate: form.dueDate || null,
  };
  // the task as it was loaded, so only real changes are sent
  const original = editing ? {
    title: (task.title ?? "").trim(),
    description: (task.description ?? "").trim(),
    status: task.status,
    priority: task.priority,
    type: task.type ?? "TASK",
    assignee: task.assignee?._id ? String(task.assignee._id) : null,
    reporter: task.reporter?._id ? String(task.reporter._id) : null,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : null,
  } : null;
  const changes = editing
    ? Object.fromEntries(Object.entries(current).filter(([key, value]) => value !== original[key]))
    : null;
  const added = attachments.filter((a) => a.pending);
  const removed = editing ? (task.attachments ?? []).filter((a) => !attachments.some((x) => x._id === a._id)) : [];
  const dirty = editing && (Object.keys(changes).length > 0 || added.length > 0 || removed.length > 0);

  const submit = async (e) => {
    e.preventDefault();
    if (locked) return;
    if (editing && !dirty) return onClose(); // nothing to save
    setError("");
    setLoading(true);
    try {
      if (editing) {
        // email only the people mentioned for the first time in this edit
        if (changes.description) {
          const already = new Set(findMentionedIds(original.description, members));
          const fresh = findMentionedIds(changes.description, members).filter((id) => !already.has(id));
          if (fresh.length) changes.mentions = fresh;
        }
        if (added.length) changes.addAttachments = added.map(({ key, name, size, contentType }) => ({ key, name, size, contentType }));
        if (removed.length) changes.removeAttachments = removed.map((a) => a._id);
        await updateTask(task._id, changes);
        removed.forEach((a) => deleteStoredFile(a.key)); // saved, so the old files can go from S3
      } else {
        // create: skip empty optional fields
        const body = { title: current.title, status: current.status, priority: current.priority, type: current.type, projectId };
        // the server makes the creator the reporter; only send it when someone else was picked
        if (current.reporter && current.reporter !== String(meId)) body.reporter = current.reporter;
        if (current.description) {
          body.description = current.description;
          const mentions = findMentionedIds(current.description, members);
          if (mentions.length) body.mentions = mentions;
        }
        if (current.assignee) body.assignee = current.assignee;
        if (current.dueDate) body.dueDate = current.dueDate;
        if (attachments.length) body.attachments = attachments.map(({ key, name, size, contentType }) => ({ key, name, size, contentType }));
        await createTask(body);
      }
      onSaved(editing ? "Task updated" : "Task created");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const frozen = locked || loading || !mayEdit;
  const hint = dueHint(form.dueDate, form.status);
  const ticket = editing ? `${typeOf(form.type).id}-${String(task._id).slice(-4).toUpperCase()}` : null;
  const when = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <form className={`modal modal--task jira ${editing ? "" : "jira--new"}`} onSubmit={submit} role="dialog" aria-modal="true"
        aria-label={editing ? "Edit task" : "New task"} style={{ "--col": statusOf(form.status).color }}
        onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && e.target.tagName !== "BUTTON" && e.currentTarget.requestSubmit()}>
        <div className="jira__bar" />

        <header className="jira__head">
          <div className="jira__crumb">
            <TypeIcon type={form.type} size={22} />
            <span>{editing ? ticket : `New ${typeOf(form.type).title.toLowerCase()}`}</span>
            {locked && <span className="jira__locked"><Lock width={13} height={13} />Cancelled · read-only</span>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={loading} aria-label="Close"><Close /></button>
        </header>

        <div className="jira__body">
          {/* ---------- left: what the task is ---------- */}
          <section className="jira__main">
            {locked && (
              <p className="notice notice--warn"><Lock width={16} height={16} />Cancelled tasks can't be edited. Create a new task if work needs to continue.</p>
            )}

            <input className="jira__title" placeholder="What needs to be done?" maxLength={150} disabled={frozen}
              value={form.title} onChange={(e) => set({ title: e.target.value })} required autoFocus={!editing} />

            {form.title.length >= 100 && <span className="jira__count">{form.title.length} / 150</span>}

            <h3 className="jira__label">Status</h3>
            <div className="flow" role="radiogroup" aria-label="Status">
              {FLOW.map((st, i) => {
                const now = FLOW.findIndex((x) => x.id === form.status);
                return (
                  <button type="button" key={st.id} role="radio" aria-checked={form.status === st.id} disabled={frozen}
                    className={`flow__step ${i <= now ? "is-past" : ""} ${form.status === st.id ? "is-now" : ""}`}
                    style={{ "--c": st.color }} onClick={() => set({ status: st.id })}>
                    <i>{i < now ? <Check width={12} height={12} /> : i + 1}</i>{st.title}
                  </button>
                );
              })}
              {editing && !locked && mayCancel && (
                <button type="button" className={`flow__cancel ${form.status === "CANCELLED" ? "is-on" : ""}`} disabled={loading}
                  onClick={() => set({ status: form.status === "CANCELLED" ? task.status : "CANCELLED" })}>
                  {form.status === "CANCELLED" ? "Undo cancel" : "Cancel task"}
                </button>
              )}
            </div>
            {becomingCancelled && (
              <p className="notice notice--warn"><Alert width={16} height={16} />Once saved as cancelled, this task can no longer be edited.</p>
            )}

            <h3 className="jira__label">Description</h3>
            {frozen || (editing && !descOpen) ? (
              <div className={`jira__desc jira__desc--view ${frozen ? "is-frozen" : ""}`}
                role={frozen ? undefined : "button"} tabIndex={frozen ? -1 : 0}
                onClick={() => !frozen && setDescOpen(true)}
                onKeyDown={(e) => !frozen && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setDescOpen(true))}>
                {form.description
                  ? <MentionText text={form.description} members={members} />
                  : <span className="jira__placeholder">{frozen ? "No description" : "Add a description… type @ to mention someone"}</span>}
              </div>
            ) : (
              <MentionTextarea className="jira__desc" rows={7} members={members} autoFocus={editing}
                placeholder="Add more detail: what, why, and what done looks like. Type @ to mention someone."
                value={form.description} onChange={(description) => set({ description })}
                onBlur={() => editing && setDescOpen(false)} />
            )}

            <TaskAttachments taskId={task?._id} value={attachments}
              onChange={setAttachments} readOnly={locked || loading} canAdd={mayEdit} members={members}
              canRemove={(att) => !editing || att.pending || canDelete(task?.myRole) || String(att.uploadedBy) === String(me?._id ?? me?.id)} />

            {error && <p className="notice notice--error">{error}</p>}

            {editing ? (
              <>
                <div className="tabs" role="tablist">
                  {["comments", "history"].map((t) => (
                    <button type="button" key={t} role="tab" aria-selected={tab === t}
                      className={`tabs__tab ${tab === t ? "is-on" : ""}`} onClick={() => setTab(t)}>
                      {t === "comments" ? "Comments" : "History"}
                    </button>
                  ))}
                </div>
                {tab === "comments" ? <TaskComments taskId={task._id} members={members} canPost={mayEdit} /> : <TaskHistory taskId={task._id} members={members} />}
              </>
            ) : (
              <div className="jira__later">
                <MessageSquare width={18} height={18} />
                <span>Comments and activity appear here once the task is created.</span>
              </div>
            )}
          </section>

          {/* ---------- right: details ---------- */}
          <aside className="jira__side">
            <h3 className="jira__label">Details</h3>

            <OptionPicker label="Type" value={form.type} options={TYPES} disabled={frozen}
              onChange={(type) => set({ type })} renderIcon={(t) => <TypeIcon type={t.id} size={22} />} />

            <OptionPicker label="Priority" value={form.priority} options={PRIORITIES} disabled={frozen}
              onChange={(priority) => set({ priority })} />

            <PersonPicker label="Assignee" projectId={projectId} value={assignee} onChange={setAssignee}
              disabled={frozen} noneLabel="Unassigned" meId={meId} />

            <PersonPicker label="Reporter" projectId={projectId} value={reporter} onChange={setReporter}
              disabled={frozen} meId={meId} />

            <label className="jira__row">
              <span className="field__label">Due date</span>
              <span className="field__box">
                <Calendar className="field__icon" />
                <input type="date" disabled={frozen} value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
              </span>
              {hint && <span className={`due-hint ${hint.tone}`}>{hint.text}</span>}
            </label>

            {editing && (
              <dl className="jira__meta">
                {task.createdAt && <><dt>Created</dt><dd>{when(task.createdAt)}</dd></>}
                {task.updatedAt && <><dt>Updated</dt><dd>{when(task.updatedAt)}</dd></>}
              </dl>
            )}
          </aside>
        </div>

        <footer className="jira__foot">
          <span className={`jira__hint ${dirty ? "is-dirty" : ""}`}>
            {locked || (!dirty && !mayEdit) ? "" : dirty ? <><i />Unsaved changes</> : "Ctrl + Enter to save"}
          </span>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>{locked || (!dirty && !mayEdit) ? "Close" : "Cancel"}</button>
          {!locked && (mayEdit || mayCancel || dirty) && (
            <button className="btn btn--primary" disabled={loading || !form.title.trim() || (editing && !dirty)}>
              {loading ? <span className="spinner" /> : editing ? "Save changes" : "Create task"}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}
