import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  register,
  uploadImage,
  deleteImage,
} from "../api/index.js";

import AuthShell from "../components/layout/AuthShell.jsx";
import Field from "../components/common/Field.jsx";
import ImageDrop from "../components/common/ImageDrop.jsx";
import { Lock, Mail, User } from "../components/common/Icons.jsx";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [file, setFile] = useState(null);
  const [profileKey, setProfileKey] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const change = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const changeImage = async (newFile) => {
    if (!newFile) return;

    setError("");
    setFile(newFile);
    setUploading(true);

    const previousKey = profileKey;

    try {
      // 1. Upload the newly selected image.
      const newKey = await uploadImage(newFile);

      // 2. Keep the new image key.
      setProfileKey(newKey);

      // 3. Delete the old image only after successful upload.
      if (previousKey && previousKey !== newKey) {
        try {
          await deleteImage(previousKey);
        } catch (err) {
          console.error("Previous image cleanup failed:", err);
        }
      }
    } catch (err) {
      setError(err.message || "Image upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        ...form,
        ...(profileKey && { profileKey }),
      });

      navigate("/login", {
        state: { registered: true },
      });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="auth__title">Create your account</h1>
      <p className="auth__sub">
        It takes less than a minute.
      </p>

      <form onSubmit={submit} className="stack">
        <div className="avatar-pick">
          <ImageDrop
            shape="round"
            file={file}
            onChange={changeImage}
            onError={setError}
          />

          <div>
            <strong>Profile photo</strong>
            <span>
              {uploading
                ? "Uploading image..."
                : "Optional · PNG, JPG or WEBP"}
            </span>
          </div>
        </div>

        <Field
          label="Full name"
          icon={User}
          name="name"
          placeholder="John Doe"
          autoComplete="name"
          value={form.name}
          onChange={change}
          required
        />

        <Field
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={form.email}
          onChange={change}
          required
        />

        <Field
          label="Password"
          icon={Lock}
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={change}
          required
        />

        {error && (
          <p className="notice notice--error">{error}</p>
        )}

        <button
          className="btn btn--primary btn--block"
          disabled={loading || uploading}
        >
          {loading
            ? "Creating account..."
            : uploading
              ? "Uploading image..."
              : "Create account"}
        </button>
      </form>

      <p className="auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}