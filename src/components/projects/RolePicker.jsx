import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PROJECT_ROLES, roleOf } from "../../constants/projectRoles.js";
import { Check, Chevron } from "../common/Icons.jsx";

const MENU_WIDTH = 264;
const MENU_HEIGHT = 300;

// The menu is position: fixed so the scrolling member list can't clip it
export default function RolePicker({ value, onChange, disabled, name }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState(null);
  const root = useRef(null);
  const current = roleOf(value);

  useLayoutEffect(() => {
    if (!open) return;
    const box = root.current.getBoundingClientRect();
    const below = box.bottom + 6 + MENU_HEIGHT <= window.innerHeight;
    setPlace({
      left: Math.max(12, box.right - MENU_WIDTH),
      ...(below ? { top: box.bottom + 6 } : { bottom: window.innerHeight - box.top + 6 }),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => root.current && !root.current.contains(e.target) && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const show = () => {
    setActive(Math.max(PROJECT_ROLES.findIndex((r) => r.id === value), 0));
    setOpen(true);
  };
  const pick = (id) => { onChange(id); setOpen(false); };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); show(); }
      return;
    }
    if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    else if (e.key === "Tab") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % PROJECT_ROLES.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + PROJECT_ROLES.length) % PROJECT_ROLES.length); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(PROJECT_ROLES[active].id); }
  };

  return (
    <div className="role" ref={root} onKeyDown={onKeyDown}>
      <button type="button" className={`role__btn ${open ? "is-open" : ""}`} disabled={disabled} style={{ "--c": current.color }}
        aria-haspopup="listbox" aria-expanded={open} aria-label={`Role of ${name}: ${current.title}`}
        onClick={() => (open ? setOpen(false) : show())}>
        <i />{current.title}<Chevron width={14} height={14} />
      </button>

      {open && place && (
        <ul className="role__menu" role="listbox" aria-label={`Role of ${name}`} style={{ ...place, width: MENU_WIDTH }}>
          {PROJECT_ROLES.map((r, i) => (
            <li key={r.id} role="option" aria-selected={r.id === value} style={{ "--c": r.color, "--i": i }}
              className={`role__opt ${i === active ? "is-active" : ""} ${r.id === value ? "is-selected" : ""}`}
              onPointerEnter={() => setActive(i)} onClick={() => pick(r.id)}>
              <i />
              <span>
                <strong>{r.title}</strong>
                <small>{r.can.map((c) => <b key={c}>{c}</b>)}</small>
              </span>
              {r.id === value && <Check width={16} height={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
