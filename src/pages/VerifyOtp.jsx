import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../api/index.js";
import { saveTokens } from "../utils/auth.js";
import AuthShell from "../components/layout/AuthShell.jsx";

const LENGTH = 6;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const boxes = useRef([]);

  // Opened directly, without going through login first
  if (!state?.email) return <Navigate to="/login" replace />;

  const submit = async (code) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await verifyOtp({ email: state.email, otp: code });
      saveTokens({ ...data, email: state.email });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
      setDigits(Array(LENGTH).fill(""));
      boxes.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const update = (next) => {
    setDigits(next);
    if (next.every(Boolean)) submit(next.join(""));
  };

  const onChange = (i, value) => {
    const v = value.replace(/\D/g, "");
    if (!v) return;
    const next = [...digits];
    // typing or pasting several digits fills the following boxes
    [...v].slice(0, LENGTH - i).forEach((d, k) => (next[i + k] = d));
    update(next);
    boxes.current[Math.min(i + v.length, LENGTH - 1)]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) next[i] = "";
      else if (i > 0) { next[i - 1] = ""; boxes.current[i - 1]?.focus(); }
      setDigits(next);
    }
    if (e.key === "ArrowLeft") boxes.current[i - 1]?.focus();
    if (e.key === "ArrowRight") boxes.current[i + 1]?.focus();
  };

  return (
    <AuthShell>
      <h1 className="auth__title">Check your email</h1>
      <p className="auth__sub">We sent a 6-digit code to <strong>{state.email}</strong>. It expires in 5 minutes.</p>
      <div className="otp" onPaste={(e) => { e.preventDefault(); onChange(0, e.clipboardData.getData("text")); }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (boxes.current[i] = el)}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={i === 0}
            maxLength={LENGTH}
            disabled={loading}
            aria-label={`Digit ${i + 1}`}
            className={d ? "is-filled" : ""}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
      {error && <p className="notice notice--error">{error}</p>}
      <button className="btn btn--primary btn--block" disabled={loading || digits.some((d) => !d)} onClick={() => submit(digits.join(""))}>
        {loading ? <span className="spinner" /> : "Verify & continue"}
      </button>
      <p className="auth__switch"><Link to="/login">Back to log in</Link></p>
    </AuthShell>
  );
}
