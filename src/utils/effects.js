// Cursor-driven effects for the whole app, from one pointer listener (throttled to one update per frame):
//  - the page glow follows the cursor            (--cx/--cy on <html>, --px/--py from -1 to 1 for parallax)
//  - .spot elements get a light under the cursor  (--x/--y on the element)
//  - .tilt elements lean toward the cursor        (--rx/--ry on the element, mouse only)
//  - .magnet buttons are pulled toward the cursor (--mgx/--mgy on the element, mouse only)
// Does nothing for people who prefer reduced motion.
export function installPointerEffects() {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  let frame = 0;
  let last = null;
  let spot = null;
  let magnet = null;

  const clear = (el, ...vars) => vars.forEach((v) => el.style.removeProperty(v));

  const update = () => {
    frame = 0;
    const e = last;
    root.style.setProperty("--cx", `${e.clientX}px`);
    root.style.setProperty("--cy", `${e.clientY}px`);
    root.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
    root.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));

    const target = e.target instanceof Element ? e.target : null;
    const mouse = e.pointerType === "mouse";

    const nextSpot = target?.closest(".spot") ?? null;
    if (spot && spot !== nextSpot) clear(spot, "--rx", "--ry");
    spot = nextSpot;
    if (spot) {
      const r = spot.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      spot.style.setProperty("--x", `${x}px`);
      spot.style.setProperty("--y", `${y}px`);
      if (mouse && spot.classList.contains("tilt")) {
        const strength = Number(spot.dataset.tilt || 5);
        spot.style.setProperty("--rx", `${((0.5 - y / r.height) * strength).toFixed(2)}deg`);
        spot.style.setProperty("--ry", `${((x / r.width - 0.5) * strength).toFixed(2)}deg`);
      }
    }

    const nextMagnet = mouse ? target?.closest(".magnet") ?? null : null;
    if (magnet && magnet !== nextMagnet) clear(magnet, "--mgx", "--mgy");
    magnet = nextMagnet;
    if (magnet && !magnet.disabled) {
      const r = magnet.getBoundingClientRect();
      magnet.style.setProperty("--mgx", `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
      magnet.style.setProperty("--mgy", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
    }
  };

  window.addEventListener("pointermove", (e) => {
    last = e;
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });

  // pointer left the window: let everything settle back
  document.addEventListener("pointerleave", () => {
    if (spot) clear(spot, "--rx", "--ry");
    if (magnet) clear(magnet, "--mgx", "--mgy");
    spot = magnet = null;
  });
}
