import { useEffect, useRef, useState } from "react";
import { ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_MB, deleteStoredFile, getViewUrl, uploadAttachment } from "../../api/index.js";
import useMe from "../../hooks/useMe.js";
import { Close, ExternalLink, Paperclip, Plus, UploadCloud } from "../common/Icons.jsx";

export const MAX_ATTACHMENTS = 10;

const sizeText = (bytes = 0) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const extOf = (name = "") => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const isImage = (att) => (att.contentType || "").startsWith("image/");
const dateText = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "");

// colour of the badge for a file type
const BADGE = {
  pdf: "#ef4444", doc: "#3b82f6", docx: "#3b82f6", xls: "#10b981", xlsx: "#10b981", csv: "#10b981",
  ppt: "#f59e0b", pptx: "#f59e0b", zip: "#8b5cf6", txt: "#64748b",
};

function Preview({ att }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (isImage(att)) getViewUrl(att.key).then((u) => alive && setUrl(u)).catch(() => {});
    return () => { alive = false; };
  }, [att.key, att.contentType]);
  if (url) return <img className="file__thumb" src={url} alt="" />;
  const ext = extOf(att.name);
  return <span className="file__badge" style={{ "--c": BADGE[ext] ?? "#64748b" }}>{ext.slice(0, 4) || "file"}</span>;
}

// Files go to S3 as soon as they are picked, but they are only marked `pending`: the task form
// saves them (or deletes them from S3 when it is closed without saving). Taking away a file that is
// already saved is also only staged; the form applies it on save.
export default function TaskAttachments({ value, onChange, readOnly = false, canAdd = true, members = [], canRemove = () => true }) {
  const me = useMe();
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState([]); // files being sent right now
  const [error, setError] = useState("");

  const busy = uploading.length > 0;
  const full = value.length + uploading.length >= MAX_ATTACHMENTS;
  const uploader = (id) => {
    if (String(id) === String(me?._id ?? me?.id)) return "You";
    return members.find((m) => String(m._id) === String(id))?.name ?? "";
  };

  const open = async (att) => {
    const tab = window.open("", "_blank"); // opened first so the browser doesn't block it
    try {
      const url = await getViewUrl(att.key);
      if (tab) { tab.opener = null; tab.location.href = url; }
    } catch (err) {
      tab?.close();
      setError(err.message);
    }
  };

  const add = async (fileList) => {
    const files = [...fileList];
    if (!files.length || busy) return;
    setError("");

    const room = MAX_ATTACHMENTS - value.length;
    if (files.length > room) return setError(room > 0 ? `You can add ${room} more file${room === 1 ? "" : "s"} (limit is ${MAX_ATTACHMENTS})` : `A task can have at most ${MAX_ATTACHMENTS} attachments`);
    for (const f of files) {
      if (!ATTACHMENT_EXTENSIONS.includes(extOf(f.name))) return setError(`"${f.name}" is not an allowed file type`);
      if (f.size > MAX_ATTACHMENT_MB * 1024 * 1024) return setError(`"${f.name}" is larger than ${MAX_ATTACHMENT_MB} MB`);
    }

    setUploading(files.map((f, i) => ({ id: `${i}-${f.name}`, name: f.name, size: f.size })));
    let list = value;
    try {
      for (const [i, file] of files.entries()) {
        const meta = await uploadAttachment(file);
        list = [...list, { ...meta, _id: meta.key, pending: true, uploadedBy: me?._id ?? me?.id, uploadedAt: new Date().toISOString() }];
        onChange(list);
        setUploading((cur) => cur.filter((u) => u.id !== `${i}-${file.name}`));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading([]);
      if (input.current) input.current.value = "";
    }
  };

  const remove = (att) => {
    setError("");
    if (att.pending) deleteStoredFile(att.key); // never saved on the task, so it can go from S3 right away
    onChange(value.filter((a) => a.key !== att.key));
  };

  const dropProps = readOnly || !canAdd || full ? {} : {
    onDragOver: (e) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); },
  };
  const empty = value.length === 0 && uploading.length === 0;

  return (
    <section className={`attach ${over ? "is-over" : ""}`} {...dropProps}>
      <header className="attach__head">
        <h3 className="jira__label"><Paperclip width={15} height={15} />Attachments</h3>
        {value.length > 0 && <span className="attach__count">{value.length} / {MAX_ATTACHMENTS}</span>}
        {!readOnly && canAdd && !empty && (
          <button type="button" className="btn btn--ghost btn--sm attach__add" disabled={busy || full} onClick={() => input.current.click()}>
            <Plus width={15} height={15} />Add
          </button>
        )}
      </header>

      {!readOnly && canAdd && empty && (
        <button type="button" className="attach__empty" onClick={() => input.current.click()}>
          <UploadCloud width={26} height={26} />
          <strong>Drop files here or <u>browse</u></strong>
          <span>Images, PDF, Office files, txt, csv, zip · up to {MAX_ATTACHMENT_MB} MB each · max {MAX_ATTACHMENTS} files</span>
        </button>
      )}
      {(readOnly || !canAdd) && empty && <p className="hint">No attachments.</p>}

      <input ref={input} type="file" hidden multiple accept={ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(",")} onChange={(e) => add(e.target.files)} />

      {error && <p className="notice notice--error">{error}</p>}

      {!empty && (
        <ul className="files">
          {value.map((att) => {
            const who = uploader(att.uploadedBy);
            return (
              <li key={att._id ?? att.key} className={`file ${att.pending ? "is-new" : ""}`}>
                <button type="button" className="file__main" onClick={() => open(att)} title="Open in a new tab">
                  <Preview att={att} />
                  <span className="file__info">
                    <strong>{att.name}</strong>
                    <small>{[sizeText(att.size), att.pending ? "Not saved yet" : [who, dateText(att.uploadedAt)].filter(Boolean).join(" · ")].filter(Boolean).join(" · ")}</small>
                  </span>
                </button>
                <span className="file__actions">
                  <button type="button" className="file__btn" onClick={() => open(att)} aria-label={`Open ${att.name}`}><ExternalLink width={15} height={15} /></button>
                  {!readOnly && canRemove(att) && (
                    <button type="button" className="file__btn file__btn--danger" onClick={() => remove(att)} aria-label={`Remove ${att.name}`}>
                      <Close width={15} height={15} />
                    </button>
                  )}
                </span>
              </li>
            );
          })}
          {uploading.map((u) => (
            <li key={u.id} className="file file--uploading">
              <span className="file__main">
                <span className="file__badge file__badge--wait"><span className="spinner" /></span>
                <span className="file__info"><strong>{u.name}</strong><small>Uploading… {sizeText(u.size)}</small></span>
              </span>
              <span className="file__bar" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
