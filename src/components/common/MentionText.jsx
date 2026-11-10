import { splitMentions } from "../../utils/mentions.js";

// Shows text with the @mentions of project members highlighted. Line breaks are kept.
export default function MentionText({ text, members = [], className = "" }) {
  return (
    <p className={`mention-text ${className}`}>
      {splitMentions(text, members).map((part, i) =>
        part.mention ? <span key={i} className="mention-tag">{part.text}</span> : part.text,
      )}
    </p>
  );
}
