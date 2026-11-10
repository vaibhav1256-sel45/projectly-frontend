import { useCallback, useEffect, useState } from "react";
import { addComment, listComments } from "../../api/index.js";
import { findMentionedIds } from "../../utils/mentions.js";
import { getTokens } from "../../utils/auth.js";
import useMe from "../../hooks/useMe.js";
import MentionText from "../common/MentionText.jsx";
import MentionTextarea from "../common/MentionTextarea.jsx";
import UserAvatar from "../common/UserAvatar.jsx";

const LIMIT = 5;

const formatTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function TaskComments({ taskId, members = [], canPost = true }) {
  const me = useMe();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // page 1 replaces the list, later pages are added to the end
  const load = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await listComments(taskId, { pageNo: page, limit: LIMIT });
      setComments((cur) => (page === 1 ? res.data : [...cur, ...res.data]));
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

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      await addComment(taskId, content, findMentionedIds(content, members));
      setText("");
      await load(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="comments">
      <h3>Comments{total > 0 && <span>{total}</span>}</h3>

      {canPost && (
      <div className="comments__new">
        <UserAvatar user={me ?? { name: (getTokens()?.email ?? "me").split("@")[0] }} size={32} />
        <MentionTextarea rows={2} value={text} maxLength={1000} members={members}
          placeholder="Write a comment… type @ to mention someone"
          onChange={setText}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation(); // post the comment only, don't let the task form save and close
              send();
            }
          }} />
        <button type="button" className="btn btn--primary btn--sm" disabled={sending || !text.trim()} onClick={send}>
          {sending ? <span className="spinner" /> : "Comment"}
        </button>
      </div>
      )}

      {error && <p className="notice notice--error">{error}</p>}

      <ul className="comments__list">
        {comments.map((c) => (
          <li key={c._id}>
            <UserAvatar user={c.createdBy} size={30} />
            <div>
              <p className="comments__who"><strong>{c.createdBy?.name || "Unknown user"}</strong><time>{formatTime(c.createdAt)}</time></p>
              <MentionText className="comments__text" text={c.content} members={members} />
            </div>
          </li>
        ))}
      </ul>

      {!loading && comments.length === 0 && !error && <p className="hint">No comments yet.</p>}
      {loading && <p className="hint">Loading comments…</p>}
      {!loading && comments.length < total && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => load(pageNo + 1)}>
          Load more ({total - comments.length} more)
        </button>
      )}
    </section>
  );
}
