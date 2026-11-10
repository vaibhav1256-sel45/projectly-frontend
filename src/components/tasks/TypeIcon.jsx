import { Bookmark, Bug, CheckSquare } from "../common/Icons.jsx";
import { typeOf } from "../../constants/taskMeta.js";

const ICONS = { CheckSquare, Bug, Bookmark };

// The coloured square that marks a task as a task, a bug or a story
export default function TypeIcon({ type, size = 22 }) {
  const t = typeOf(type);
  const Icon = ICONS[t.icon];
  return (
    <span className="type-icon" style={{ "--t": t.color, width: size, height: size }} title={t.title}>
      <Icon width={size * 0.66} height={size * 0.66} />
    </span>
  );
}
