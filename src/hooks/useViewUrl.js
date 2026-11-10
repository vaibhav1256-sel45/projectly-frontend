import { useEffect, useState } from "react";
import { getViewUrl } from "../api/index.js";

// Resolves a stored S3 key into a temporary image link; null while loading or if it fails.
export default function useViewUrl(key) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (key) getViewUrl(key).then((u) => alive && setUrl(u)).catch(() => {});
    return () => { alive = false; };
  }, [key]);
  return url;
}
