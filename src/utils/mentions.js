// Helpers for @mentions. A mention is stored as plain text, "@Full Name", so it reads fine anywhere.

// The "@query" being typed right before the caret, or null when the caret is not in one
export function findMentionQuery(text, caret) {
  const before = text.slice(0, caret);
  const start = before.lastIndexOf("@");
  if (start === -1) return null;
  if (start > 0 && !/\s/.test(before[start - 1])) return null; // "name@mail.com" is not a mention

  const query = before.slice(start + 1);
  if (query.length > 30 || query.includes("\n")) return null;
  return { start, query };
}

// Members whose name or email contains the query (at most `limit`)
export function filterMembers(members, query, limit = 6) {
  const q = query.trim().toLowerCase();
  return members
    .filter((m) => !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
    .slice(0, limit);
}

// Replaces "@query" with "@Name " and says where the caret should go
export function insertMention(text, start, caret, name) {
  const mention = `@${name} `;
  return { text: text.slice(0, start) + mention + text.slice(caret), caret: start + mention.length };
}

// Splits text into plain parts and mention parts, so mentions can be highlighted:
// "Hi @Aarav Sharma!" -> [{ text: "Hi " }, { text: "@Aarav Sharma", mention: true }, { text: "!" }]
export function splitMentions(text, members) {
  const names = members
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length) // longest first, so "Ann Lee" wins over "Ann"
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (names.length === 0 || !text) return [{ text: text ?? "" }];

  const pattern = new RegExp(`@(?:${names.join("|")})(?!\\w)`, "g");
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const before = text[match.index - 1];
    if (match.index > 0 && !/\s/.test(before)) continue; // must start a word
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[0], mention: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// Ids of the members @mentioned in a text. The backend emails these people.
export function findMentionedIds(text, members) {
  const idByName = new Map(members.map((m) => [m.name, String(m._id)]));
  const ids = splitMentions(text, members)
    .filter((part) => part.mention)
    .map((part) => idByName.get(part.text.slice(1)))
    .filter(Boolean);
  return [...new Set(ids)];
}
