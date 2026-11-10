import { useEffect, useRef, useState } from "react";
import { Camera, Close, Image } from "./Icons.jsx";

const MAX_MB = 5;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Click-or-drop image picker with a live preview. `shape` is "round" (avatar) or "wide" (cover).
export default function ImageDrop({ file, url, onChange, onError, shape = "wide", label = "Upload an image" }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [picked, setPicked] = useState(null);
  const preview = picked ?? url ?? null; // a file just picked, else the image already saved

  useEffect(() => {
    if (!file) return setPicked(null);
    const objectUrl = URL.createObjectURL(file);
    setPicked(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return onError?.("Use a PNG, JPG, WEBP or GIF image");
    if (f.size > MAX_MB * 1024 * 1024) return onError?.(`Image must be under ${MAX_MB} MB`);
    onError?.("");
    onChange(f);
  };

  const Icon = shape === "round" ? Camera : Image;

  return (
    <div
      className={`drop drop--${shape} ${over ? "is-over" : ""} ${preview ? "has-image" : ""}`}
      onClick={() => input.current.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current.click()}
    >
      {preview ? <img src={preview} alt="Preview" /> : (
        <div className="drop__empty">
          <Icon width={shape === "round" ? 26 : 30} height={shape === "round" ? 26 : 30} />
          {shape === "wide" && <><strong>{label}</strong><span>Drag & drop or click · PNG, JPG, WEBP · max {MAX_MB} MB</span></>}
        </div>
      )}
      {preview && (
        <button type="button" className="drop__remove" aria-label="Remove image"
          onClick={(e) => { e.stopPropagation(); onChange(null); input.current.value = ""; }}>
          <Close width={14} height={14} />
        </button>
      )}
      <input ref={input} type="file" hidden accept={TYPES.join(",")} onChange={(e) => pick(e.target.files[0])} />
    </div>
  );
}
