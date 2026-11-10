import { useEffect, useRef, useState } from "react";
import { listProjectMembers } from "../../api/index.js";
import { Check, Chevron, Search } from "../common/Icons.jsx";
import UserAvatar from "../common/UserAvatar.jsx";
import { roleLabel } from "../../constants/projectRoles.js";

// Open/close state shared by the pickers: closes on a click outside, and Esc closes the
// picker without also closing the task modal around it.
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const onKeyDown = (e) => {
    if (open && e.key === "Escape") { e.stopPropagation(); setOpen(false); }
  };
  return { open, setOpen, ref, onKeyDown };
}

// Pick one of a few fixed options (type, priority). options: { id, title, color, hint?, render? }
export function OptionPicker({ label, value, options, onChange, disabled, renderIcon }) {
  const { open, setOpen, ref, onKeyDown } = usePopover();
  const current = options.find((o) => o.id === value) ?? options[0];
  const mark = (o) => (renderIcon ? renderIcon(o) : <i className="prio-dot" style={{ background: o.color }} />);
  return (
    <div className={`jira__row ${open ? "is-open" : ""}`} ref={ref} onKeyDown={onKeyDown}>
      <span className="field__label">{label}</span>
      <button type="button" className="assign-btn" disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        {mark(current)}
        <span className="assign-btn__name">{current.title}</span>
        <Chevron className="sel__chev" width={16} height={16} />
      </button>
      {open && (
        <div className="assign-pop" role="listbox" aria-label={label}>
          <div className="assign-list">
            {options.map((o, i) => (
              <button type="button" key={o.id} role="option" aria-selected={value === o.id} style={{ animationDelay: `${i * 25}ms` }}
                className={`assign-opt ${value === o.id ? "is-on" : ""}`}
                onClick={() => { onChange(o.id); setOpen(false); }}>
                {mark(o)}
                <span><strong>{o.title}</strong>{o.hint && <small>{o.hint}</small>}</span>
                {value === o.id && <Check className="assign-opt__tick" width={16} height={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Pick a person from the project (owner + members), searchable.
// `value` is a user object (or null). With `noneLabel`, "nobody" is a choice too (the assignee).
export function PersonPicker({ label, projectId, value, onChange, disabled, noneLabel, meId }) {
  const { open, setOpen, ref, onKeyDown } = usePopover();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | ready | error

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setState("loading");
    const t = setTimeout(() => {
      listProjectMembers(projectId, { searchKey: query.trim() })
        .then((res) => { if (alive) { setPeople(res.data ?? []); setState("ready"); } })
        .catch(() => alive && setState("error"));
    }, query ? 300 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [open, projectId, query]);

  const selectedId = value?._id ? String(value._id) : "";
  const pick = (user) => { onChange(user); setOpen(false); setQuery(""); };
  const tag = (u) => (String(u._id) === String(meId) ? "You" : u.role === "OWNER" ? "Project owner" : u.email || roleLabel(u.role));

  return (
    <div className={`jira__row ${open ? "is-open" : ""}`} ref={ref} onKeyDown={onKeyDown}>
      <span className="field__label">{label}</span>
      <button type="button" className="assign-btn" disabled={disabled} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {value ? <UserAvatar user={value} size={26} /> : <span className="uavatar uavatar--empty">—</span>}
        <span className="assign-btn__name">
          {value ? value.name || "Unknown user" : noneLabel}
          {value && String(value._id) === String(meId) && <em className="assign-btn__me">you</em>}
        </span>
        <Chevron className="sel__chev" width={16} height={16} />
      </button>

      {open && (
        <div className="assign-pop">
          <label className="field__box assign-search">
            <Search width={16} height={16} className="field__icon" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people…" />
          </label>
          <div className="assign-list">
            {noneLabel && !query && (
              <button type="button" className={`assign-opt ${!selectedId ? "is-on" : ""}`} onClick={() => pick(null)}>
                <span className="uavatar uavatar--empty">—</span>
                <span><strong>{noneLabel}</strong></span>
              </button>
            )}
            {people.map((u) => (
              <button type="button" key={u._id} className={`assign-opt ${selectedId === String(u._id) ? "is-on" : ""}`} onClick={() => pick(u)}>
                <UserAvatar user={u} size={28} />
                <span><strong>{u.name || "Unknown user"}</strong><small>{tag(u)}</small></span>
                {selectedId === String(u._id) && <Check className="assign-opt__tick" width={16} height={16} />}
              </button>
            ))}
            {state === "loading" && people.length === 0 && <p className="hint">Loading people…</p>}
            {state === "error" && <p className="hint">Couldn't load project members.</p>}
            {state === "ready" && people.length === 0 && (
              <p className="hint">{query ? "No one matches your search." : "This project has no members yet."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
