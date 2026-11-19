import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/index.js";
import AuthShell from "../components/layout/AuthShell.jsx";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("This verification link is missing its token.");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err.message || "This verification link is invalid or has expired.");
      });
  }, [token]);

  return (
    <AuthShell>
      {status === "verifying" && (
        <>
          <h1 className="auth__title">Verifying your email…</h1>
          <p className="auth__sub">Hang on a second.</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="auth__title">Email verified</h1>
          <p className="auth__sub">Your account is ready. You can log in now.</p>
          <Link to="/login" className="btn btn--primary btn--block">Go to login</Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="auth__title">Link didn't work</h1>
          <p className="notice notice--error">{error}</p>
          <p className="auth__switch">
            Need a new link? <Link to="/login">Go to login</Link> and try signing in — we'll let you resend it from there.
          </p>
        </>
      )}
    </AuthShell>
  );
}
