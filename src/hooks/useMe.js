import { useEffect, useState } from "react";
import { getMe } from "../api/index.js";
import { getTokens } from "../utils/auth.js";

// One request per login, shared by everything that shows "me" (top bar, comment box).
// Keyed by the access token, so logging in as someone else never shows the previous user.
let cache = null;

export default function useMe() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    const token = getTokens()?.access_token;
    if (!token) return;
    if (cache?.token !== token) {
      const entry = { token, promise: null };
      // a failed request is not remembered: the next component that asks tries again
      entry.promise = getMe().then((res) => res.data).catch(() => {
        if (cache === entry) cache = null;
        return null;
      });
      cache = entry;
    }
    let alive = true;
    cache.promise.then((user) => alive && setMe(user));
    return () => { alive = false; };
  }, []);

  return me;
}
