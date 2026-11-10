// Where the caret is inside a textarea, in pixels (relative to the textarea's own top-left corner).
// A textarea cannot tell us, so a hidden copy with the same styling is measured instead.
const COPIED = [
  "direction", "boxSizing", "width", "overflowX", "overflowY", "borderTopWidth", "borderRightWidth",
  "borderBottomWidth", "borderLeftWidth", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "lineHeight", "fontFamily",
  "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize",
];

export function getCaretCoordinates(textarea, position) {
  const computed = getComputedStyle(textarea);
  const mirror = document.createElement("div");
  COPIED.forEach((name) => { mirror.style[name] = computed[name]; });
  Object.assign(mirror.style, { position: "absolute", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", top: "0", left: "-9999px" });

  mirror.textContent = textarea.value.slice(0, position);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(position) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const lineHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.4;
  const coords = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft - textarea.scrollLeft,
    lineHeight,
  };
  document.body.removeChild(mirror);
  return coords;
}
