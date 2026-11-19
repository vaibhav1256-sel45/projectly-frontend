import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, resendVerification } from "../api/index.js";
import AuthShell from "../components/layout/AuthShell.jsx";
import Field from "../components/common/Field.jsx";
import { Lock, Mail } from "../components/common/Icons.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setResent(false);
    setLoading(true);
    try {
      await login(form);
      navigate("/verify", { state: { email: form.email} });
    } catch (err) {
      setError(err.message);
      setUnverified(/verify your email/i.test(err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try {
      await resendVerification(form.email);
      setResent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="auth__title">Welcome back</h1>
      <p className="auth__sub">Log in and we'll email you a one-time code.</p>
      {state?.registered && <p className="notice notice--success">Account created. Check your email to verify it, then log in.</p>}
      <form onSubmit={submit} className="stack">
        <Field label="Email" icon={Mail} name="email" type="email" placeholder="you@company.com" autoComplete="email" value={form.email} onChange={change} required />
        <Field label="Password" icon={Lock} name="password" type="password" placeholder="••••••••" autoComplete="current-password" value={form.password} onChange={change} required />
        {error && <p className="notice notice--error">{error}</p>}
        {resent && <p className="notice notice--success">A new verification link was sent, check your email.</p>}
        <button className="btn btn--primary btn--block" disabled={loading}>
          {loading ? <span className="spinner" /> : "Continue"}
        </button>
        {unverified && !resent && (
          <button type="button" className="btn btn--block" disabled={loading} onClick={resend}>
            Resend verification email
          </button>
        )}
      </form>
      <p className="auth__switch">New here? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}
