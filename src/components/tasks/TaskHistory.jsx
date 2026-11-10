import { useCallback, useEffect, useState } from "react";
import { listHistory } from "../../api/index.js";
import { priorityOf, statusOf, typeOf } from "../../constants/taskMeta.js";
import MentionText from "../common/MentionText.jsx";
import UserAvatar from "../common/UserAvatar.jsx";

const LIMIT = 8;

const formatTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const FIELD_LABEL = { type: "type", reporter: "reporter", title: "title", status: "status", priority: "priority", dueDate: "due date", assignee: "assignee", description: "description" };

// How one value is shown: a coloured chip for status/priority, a name for people, plain text otherwise
function Value({ field, value }) {
  if (value === null || value === undefined || value === "") return <em className="history__none">none</em>;
  if (field === "status") return <b className="history__chip" style={{ "--c": statusOf(value).color }}>{statusOf(value).title}</b>;
  if (field === "priority") return <b className="history__chip" style={{ "--c": priorityOf(value).color }}>{priorityOf(value).title}</b>;
  if (field === "type") return <b className="history__chip" style={{ "--c": typeOf(value).color }}>{typeOf(value).title}</b>;
  if (field === "assignee" || field === "reporter") return <b>{value.name || "Unknown user"}</b>;
  return <b>{String(value)}</b>;
}

// Long text (description, comment) is shown as from / to blocks instead of inline
function TextBlock({ text, members, tone }) {
  if (!text) return <em className="history__none">empty</em>;
  return <MentionText className={`history__text ${tone ?? ""}`} text={text} members={members} />;
}

function Change({ change, members }) {
  const label = FIELD_LABEL[change.field] ?? change.field;
  if (change.field === "attachment") {
    return (
      <p className="history__change">
        {change.to ? <>attached <b>{change.to}</b></> : <>removed the attachment <b>{change.from}</b></>}
      </p>
    );
  }
  if (change.field === "comment") {
    return (
      <div className="history__change">
        <p>added a <b>comment</b></p>
        <TextBlock text={change.to} members={members} />
      </div>
    );
  }
  if (change.field === "description") {
    // entries saved before the text was kept have no from / to
    if (change.from == null && change.to == null) return <p className="history__change">updated the <b>description</b></p>;
    return (
      <div className="history__change">
        <p>changed the <b>description</b></p>
        <div className="history__diff">
          <span className="history__tag">From</span><TextBlock text={change.from} members={members} tone="is-from" />
          <span className="history__tag">To</span><TextBlock text={change.to} members={members} tone="is-to" />
        </div>
      </div>
    );
  }
  return (
    <p className="history__change">
      changed the <b>{label}</b> <Value field={change.field} value={change.from} /> <span aria-hidden>→</span> <Value field={change.field} value={change.to} />
    </p>
  );
}

function Entry({ entry, members }) {
  const who = entry.actor?.name || (entry.actor ? "Unknown user" : "System");
  return (
    <li>
      {entry.actor ? <UserAvatar user={entry.actor} size={30} /> : <span className="uavatar uavatar--empty">⚙</span>}
      <div>
        <p className="comments__who"><strong>{who}</strong><time>{formatTime(entry.createdAt)}</time></p>
        {entry.action === "CREATED" && <p className="history__change">created this task</p>}
        {entry.action === "CREATED" && entry.changes.map((c, i) => <Change key={i} change={c} members={members} />)}
        {entry.action === "COMMENTED" && (entry.changes.length
          ? entry.changes.map((c, i) => <Change key={i} change={c} members={members} />)
          : <p className="history__change">added a comment</p>)}
        {entry.action === "PROJECT_DELETED" && <p className="history__change">cancelled this task because the project was deleted</p>}
        {entry.action === "UPDATED" && entry.changes.map((c, i) => <Change key={i} change={c} members={members} />)}
      </div>
    </li>
  );
}

export default function TaskHistory({ taskId, members = [] }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await listHistory(taskId, { pageNo: page, limit: LIMIT });
      setEntries((cur) => (page === 1 ? res.data : [...cur, ...res.data]));
      setTotal(res.meta?.totalDocuments ?? 0);
      setPageNo(page);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="history">
      {error && <p className="notice notice--error">{error}</p>}
      <ul className="comments__list history__list">
        {entries.map((entry) => <Entry key={entry._id} entry={entry} members={members} />)}
      </ul>
      {!loading && entries.length === 0 && !error && <p className="hint">No history yet.</p>}
      {loading && <p className="hint">Loading history…</p>}
      {!loading && entries.length < total && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => load(pageNo + 1)}>
          Load more ({total - entries.length} more)
        </button>
      )}
    </div>
  );
}
