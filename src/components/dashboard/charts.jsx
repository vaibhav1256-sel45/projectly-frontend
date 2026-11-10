import { useState } from "react";
import CountUp from "../common/CountUp.jsx";

// One floating tooltip shared by a whole chart. Content is plain text, so names from the API are never read as HTML.
export function useTip() {
  const [tip, setTip] = useState(null); // { x, y, title, value, note }
  const show = (content) => (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    // pointer position for the mouse, the mark's own edge for the keyboard
    const x = e.clientX || box.right;
    const y = e.clientY || box.top + box.height / 2;
    setTip({ x, y, ...content });
  };
  return { tip, show, hide: () => setTip(null) };
}

export function Tip({ tip }) {
  if (!tip) return null;
  return (
    <div className="tip" role="status" style={{ left: tip.x, top: tip.y }}>
      <strong>{tip.value}</strong>
      <span>{tip.title}</span>
      {tip.note && <small>{tip.note}</small>}
    </div>
  );
}

// Horizontal bars, one row per item. The label sits on the row, so colour is never the only way to tell rows apart.
// rows: { key, label, lead?, value, color, note? }
export function BarRows({ rows, tip, empty = "Nothing to show yet." }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="hint">{empty}</p>;
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.key} className="bars__row" tabIndex={0}
          onPointerMove={tip.show({ title: r.label, value: r.value, note: r.note })} onPointerLeave={tip.hide}
          onFocus={tip.show({ title: r.label, value: r.value, note: r.note })} onBlur={tip.hide}>
          <span className="bars__label">{r.lead}<span>{r.label}</span></span>
          <span className="bars__track">
            <i className="bars__bar" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 3 : 0, background: r.color }} />
          </span>
          <b className="bars__value">{r.value}</b>
        </li>
      ))}
    </ul>
  );
}

// A single ratio against 100%
export function Meter({ percent, label }) {
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}

export function StatTile({ icon: Icon, label, value, note, tone }) {
  return (
    <article className={`stat spot tilt ${tone ? `stat--${tone}` : ""}`}>
      <p className="stat__label">{Icon && <Icon width={16} height={16} />}{label}</p>
      <strong className="stat__value"><CountUp value={value} /></strong>
      {note && <small className="stat__note">{note}</small>}
    </article>
  );
}
