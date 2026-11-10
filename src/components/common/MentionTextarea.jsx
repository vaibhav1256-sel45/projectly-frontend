import { useLayoutEffect, useRef, useState } from "react";
import { getCaretCoordinates } from "../../utils/caret.js";
import { filterMembers, findMentionQuery, insertMention, splitMentions } from "../../utils/mentions.js";
import UserAvatar from "./UserAvatar.jsx";

// A textarea where typing "@" opens a list of members, like Jira. Arrow keys + Enter/Tab pick one, Esc closes it.
// `value` / `onChange(text)` work like a normal controlled input.
export default function MentionTextarea({ value, onChange, members = [], onKeyDown: outerKeyDown, onBlur: outerBlur, ...props }) {
  const ref = useRef(null);
  const backdropRef = useRef(null);
  const [menu, setMenu] = useState(null); // { start, query, top, left }
  const [active, setActive] = useState(0);

  const matches = menu ? filterMembers(members, menu.query) : [];

  // The tint layer must wrap the text exactly like the textarea does, so it copies the textarea's text styling
  useLayoutEffect(() => {
    const box = ref.current;
    const layer = backdropRef.current;
    if (!box || !layer) return;
    const c = getComputedStyle(box);
    ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "wordSpacing", "textTransform", "tabSize",
      "paddingTop", "paddingLeft", "paddingBottom", "borderTopWidth", "borderLeftWidth", "borderBottomWidth", "borderRightWidth", "borderRadius",
    ].forEach((name) => { layer.style[name] = c[name]; });
    // a scrollbar narrows the textarea's text area, so make room for it here too
    const scrollbar = box.offsetWidth - box.clientWidth - parseFloat(c.borderLeftWidth) - parseFloat(c.borderRightWidth);
    layer.style.paddingRight = `${parseFloat(c.paddingRight) + Math.max(scrollbar, 0)}px`;
    layer.scrollTop = box.scrollTop;
  });

  // look at the text before the caret and open / update / close the list
  const refresh = (text, caret) => {
    const found = findMentionQuery(text, caret);
    if (!found || filterMembers(members, found.query).length === 0) return setMenu(null);
    const { top, left, lineHeight } = getCaretCoordinates(ref.current, found.start);
    const maxLeft = Math.max(ref.current.clientWidth - 280, 0); // keep the list inside the box
    setMenu({ ...found, top: top + lineHeight + 6, left: Math.min(left, maxLeft) });
    setActive(0);
  };

  const pick = (member) => {
    const caret = ref.current.selectionStart;
    const next = insertMention(value, menu.start, caret, member.name);
    onChange(next.text);
    setMenu(null);
    // put the caret right after the inserted name
    requestAnimationFrame(() => {
      ref.current.focus();
      ref.current.setSelectionRange(next.caret, next.caret);
    });
  };

  const onKeyDown = (e) => {
    if (!menu || matches.length === 0) return outerKeyDown?.(e);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // close only the list, not the whole modal
      setMenu(null);
    } else {
      outerKeyDown?.(e);
    }
  };

  return (
    <div className="mention">
      <textarea
        {...props}
        ref={ref}
        value={value}
        onChange={(e) => { onChange(e.target.value); refresh(e.target.value, e.target.selectionStart); }}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) && refresh(e.target.value, e.target.selectionStart)}
        onClick={(e) => refresh(e.target.value, e.target.selectionStart)}
        onBlur={(e) => { setMenu(null); outerBlur?.(e); }}
        onScroll={(e) => { if (backdropRef.current) backdropRef.current.scrollTop = e.target.scrollTop; }}
      />

      {/* sits on top of the text and tints the @mentions; clicks go through to the textarea */}
      <div className="mention__backdrop" ref={backdropRef} aria-hidden="true">
        {splitMentions(value, members).map((part, i) => (part.mention ? <mark key={i}>{part.text}</mark> : part.text))}
        {value.endsWith("\n") ? "\n" : null}
      </div>

      {menu && matches.length > 0 && (
        <ul className="mention__menu" style={{ top: menu.top, left: menu.left }} role="listbox">
          {matches.map((m, i) => (
            <li key={m._id} role="option" aria-selected={i === active}
              className={i === active ? "is-active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(m); }}>
              <UserAvatar user={m} size={28} />
              <span>
                <strong>{m.name || "Unknown user"}</strong>
                <small>{m.role === "OWNER" ? "Project owner" : m.email}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
