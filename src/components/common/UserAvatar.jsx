import { useEffect, useState } from "react";
import useViewUrl from "../../hooks/useViewUrl.js";

const palette = ["#4d7c0f", "#2f8fe0", "#e0603c", "#7c5cff", "#0f9d8a", "#d1497b", "#b7791f"];
const colorFor = (s = "") => palette[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

// Profile photo when the user has one, otherwise initials.
// `user` can be a full user, or just { _id } when the name isn't known.
export default function UserAvatar({ user, size = 28 }) {
  const url = useViewUrl(user?.profileKey);
  // a photo that fails to load (expired link, missing file) falls back to initials
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const photo = broken ? null : url;
  if (!user) return null;
  const name = user.name || user.email || "?";
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="uavatar"
      title={user.name || "Unknown user"}
      style={{ width: size, height: size, fontSize: size * 0.4, background: photo ? "var(--surface-2)" : colorFor(user._id || name) }}
    >
      {photo ? <img src={photo} alt={name} onError={() => setBroken(true)} /> : initials}
    </span>
  );
}
