import { useState } from "react";
import { AI_MOCK, createTasksBulk, suggestTasks } from "../../api/index.js";
import { PRIORITIES, TYPES } from "../../constants/taskMeta.js";
import { Alert, ArrowLeft, Close, Plus, Sparkles, Trash } from "../common/Icons.jsx";
import { OptionPicker, PersonPicker } from "./Pickers.jsx";
import TypeIcon from "./TypeIcon.jsx";
import useMe from "../../hooks/useMe.js";

const MIN_CHARS = 20;
const MAX_CHARS = 4000;
const MAX_TASKS = 15;
const TITLE_MAX = 150;

const EXAMPLE = "Users should be able to reset their password by email. They enter their email, get a link valid for 30 minutes, and set a new password. Old sessions are logged out.";

let nextKey = 0;
const toRow = (s) => ({
  key: ++nextKey,
  include: true,
  title: s.title ?? "",
  description: s.description ?? "",
  type: TYPES.some((t) => t.id === s.type) ? s.type : "TASK",
  priority: PRIORITIES.some((p) => p.id === s.priority) ? s.priority : "MEDIUM",
  assignee: null, // a user object from PersonPicker
});

// Feature requirement -> LLM suggestions -> the user reviews/edits -> only the chosen ones are saved.
// Steps: "write" (requirement), "review" (edit the suggestions).
export default function AiTasksModal({ projectId, onClose, onSaved }) {
  const me = useMe();
  const [step, setStep] = useState("write");
  const [requirement, setRequirement] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(""); // "" | "generating" | "saving"
  const [error, setError] = useState("");

  const chosen = rows.filter((r) => r.include);
  const invalid = chosen.some((r) => !r.title.trim() || r.title.length > TITLE_MAX);
  const length = requirement.trim().length;

  const close = () => !busy && onClose();
  const update = (key, patch) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key) => setRows((rs) => rs.filter((r) => r.key !== key));
  const addRow = () => setRows((rs) => [...rs, toRow({ title: "" })]);

  const generate = async () => {
    setBusy("generating");
    setError("");
    try {
      const res = await suggestTasks(projectId, requirement.trim());
      const suggestions = res.data?.suggestions ?? [];
      if (suggestions.length === 0) throw new Error("No tasks could be suggested. Try describing the feature in more detail.");
      setRows(suggestions.slice(0, MAX_TASKS).map(toRow));
      setStep("review");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    setBusy("saving");
    setError("");
    try {
      const tasks = chosen.map((r) => ({
        title: r.title.trim(),
        description: r.description.trim(),
        type: r.type,
        priority: r.priority,
        ...(r.assignee && { assignee: String(r.assignee._id) }),
      }));
      await createTasksBulk(projectId, tasks);
      onSaved(`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} created`);
    } catch (err) {
      setError(err.message); // keep the modal open so the edits aren't lost
      setBusy("");
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal ai" role="dialog" aria-modal="true" aria-labelledby="ai-title"
        onKeyDown={(e) => e.key === "Escape" && close()}>
        <header>
          <div className="ai__title">
            <span className="ai__mark"><Sparkles width={18} height={18} /></span>
            <div>
              <h2 id="ai-title">{step === "write" ? "Generate tasks with AI" : "Review suggested tasks"}</h2>
              <p>{step === "write"
                ? "Describe a feature. You'll review every task before anything is saved."
                : "Edit, untick or remove tasks. Only the ticked ones are created."}</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={close} disabled={Boolean(busy)} aria-label="Close"><Close /></button>
        </header>

        <div className="modal__body">
          {AI_MOCK && <p className="ai__demo">Demo mode: suggestions are sample data until the backend is connected.</p>}
          {error && <p className="notice notice--error"><Alert width={16} height={16} />{error}</p>}

          {step === "write" && (
            busy === "generating" ? (
              <div className="ai__thinking" role="status">
                {[0, 1, 2].map((i) => <div key={i} className="ai__ghost" style={{ "--i": i }} />)}
                <p>Reading the requirement and breaking it into tasks…</p>
              </div>
            ) : (
              <label className="field">
                <span className="field__label">Feature requirement</span>
                <div className="field__box ai__box">
                  <textarea rows={8} autoFocus value={requirement} maxLength={MAX_CHARS}
                    onChange={(e) => setRequirement(e.target.value)}
                    onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && length >= MIN_CHARS && generate()}
                    placeholder="What should the feature do, for whom, and what counts as done?" />
                </div>
                <span className="ai__meta">
                  {length === 0
                    ? <button type="button" className="ai__example" onClick={() => setRequirement(EXAMPLE)}>Try an example</button>
                    : length < MIN_CHARS ? `${MIN_CHARS - length} more characters` : "Ctrl + Enter to generate"}
                  <span>{requirement.length} / {MAX_CHARS}</span>
                </span>
              </label>
            )
          )}

          {step === "review" && (
            <ol className="ai__list">
              {rows.map((r, i) => (
                <li key={r.key} className={`ai-row ${r.include ? "" : "is-off"}`} style={{ "--i": i }}>
                  <div className="ai-row__top">
                    <input type="checkbox" className="ai-row__check" checked={r.include} aria-label="Create this task"
                      onChange={(e) => update(r.key, { include: e.target.checked })} />
                    <TypeIcon type={r.type} size={22} />
                    <input className="ai-row__title" value={r.title} maxLength={TITLE_MAX + 20} placeholder="Task title"
                      aria-invalid={r.include && (!r.title.trim() || r.title.length > TITLE_MAX)}
                      onChange={(e) => update(r.key, { title: e.target.value })} />
                    <button type="button" className="icon-btn ai-row__remove" onClick={() => remove(r.key)} aria-label="Remove task"><Trash width={16} height={16} /></button>
                  </div>
                  {r.include && (
                    <div className="ai-row__body">
                      <textarea rows={2} value={r.description} placeholder="Description (optional)"
                        onChange={(e) => update(r.key, { description: e.target.value })} />
                      <div className="ai-row__fields">
                        <OptionPicker label="Type" value={r.type} options={TYPES}
                          renderIcon={(o) => <TypeIcon type={o.id} size={18} />} onChange={(type) => update(r.key, { type })} />
                        <OptionPicker label="Priority" value={r.priority} options={PRIORITIES} onChange={(priority) => update(r.key, { priority })} />
                        <PersonPicker label="Assignee" projectId={projectId} value={r.assignee} noneLabel="Unassigned" meId={me?._id ?? me?.id}
                          onChange={(assignee) => update(r.key, { assignee })} />
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {rows.length < MAX_TASKS && (
                <li><button type="button" className="ai__add" onClick={addRow}><Plus width={16} height={16} />Add a task</button></li>
              )}
            </ol>
          )}
        </div>

        <footer>
          {step === "write" ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={close} disabled={Boolean(busy)}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={generate} disabled={Boolean(busy) || length < MIN_CHARS}>
                {busy === "generating" ? <span className="spinner" /> : <><Sparkles width={16} height={16} />Generate tasks</>}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--ghost ai__back" onClick={() => { setStep("write"); setError(""); }} disabled={Boolean(busy)}>
                <ArrowLeft width={16} height={16} />Edit requirement
              </button>
              <button type="button" className="btn btn--ghost" onClick={generate} disabled={Boolean(busy)}>
                {busy === "generating" ? <span className="spinner" /> : "Regenerate"}
              </button>
              <button type="button" className="btn btn--primary" onClick={save} disabled={Boolean(busy) || chosen.length === 0 || invalid}>
                {busy === "saving" ? <span className="spinner" /> : `Create ${chosen.length} ${chosen.length === 1 ? "task" : "tasks"}`}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
