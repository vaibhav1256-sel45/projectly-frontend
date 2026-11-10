import { useEffect, useRef, useState } from "react";

// Counts up to `value` when it appears or changes. Non-numbers are shown as they are.
export default function CountUp({ value, duration = 900 }) {
  const numeric = typeof value === "number" && Number.isFinite(value);
  const [shown, setShown] = useState(numeric ? 0 : value);
  const from = useRef(0);

  useEffect(() => {
    if (!numeric) return setShown(value);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    const start = performance.now();
    const begin = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = begin + (value - begin) * eased;
      setShown(Number.isInteger(value) ? Math.round(current) : Math.round(current * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, numeric, duration]);

  return <>{shown}</>;
}
