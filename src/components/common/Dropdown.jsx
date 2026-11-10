import { useEffect, useId, useRef, useState } from "react";
import { Check, Chevron } from "./Icons.jsx";

// A select-like listbox. options: { value, label, color?, count?, hint? }
// Keyboard: Enter / Space / ArrowDown opens; arrows move; Enter picks; Esc or Tab closes.
export default function Dropdown({ value, options, onChange, label, heading, icon: Icon, className = "" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const list = useRef(null);
  const id = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e) => root.current && !root.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // keep the highlighted option in view
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
    setOpen(true);
  };
  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); }
    else if (e.key === "Tab") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(options[active]); }
  };

  return (
    <div className={`dd ${open ? "is-open" : ""} ${className}`} ref={root}>
      <button type="button" className="dd__trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={id}
        aria-label={label} onClick={() => (open ? setOpen(false) : show())} onKeyDown={onKeyDown}
        aria-activedescendant={open ? `${id}-${active}` : undefined}>
        {selected.color ? <i className="dd__dot" style={{ "--c": selected.color }} /> : Icon && <Icon width={16} height={16} className="dd__icon" />}
        <span className="dd__value">{selected.label}</span>
        <Chevron width={16} height={16} className="dd__chev" />
      </button>

      {open && (
        <div className="dd__menu" role="presentation">
          {heading && <p className="dd__heading">{heading}</p>}
          <ul role="listbox" id={id} ref={list} aria-label={label}>
            {options.map((o, i) => (
              <li key={o.value || "all"} id={`${id}-${i}`} role="option" aria-selected={o.value === value}
                className={`dd__option ${i === active ? "is-active" : ""} ${o.value === value ? "is-selected" : ""}`}
                style={{ "--i": i }}
                onPointerEnter={() => setActive(i)} onClick={() => pick(o)}>
                {o.color ? <i className="dd__dot" style={{ "--c": o.color }} /> : <i className="dd__dot dd__dot--all" />}
                <span className="dd__label">
                  {o.label}
                  {o.hint && <small>{o.hint}</small>}
                </span>
                {o.count !== undefined && <span className="dd__count">{o.count}</span>}
                <Check width={16} height={16} className="dd__check" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
