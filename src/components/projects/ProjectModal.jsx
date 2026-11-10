import { useEffect, useState } from "react";
import {
  createProject,
  updateProject,
  uploadImage,
  deleteImage,
  getUsers,
} from "../../api/index.js";

import { Check, Close, Plus, Search, Users } from "../common/Icons.jsx";
import ImageDrop from "../common/ImageDrop.jsx";
import UserAvatar from "../common/UserAvatar.jsx";
import RolePicker from "./RolePicker.jsx";
import { DEFAULT_ROLE, canManageMembers, roleLabel } from "../../constants/projectRoles.js";
import useViewUrl from "../../hooks/useViewUrl.js";

// Helper to safely compare user objects (works with _id or id)
const isSameUser = (u1, u2) => {
  if (!u1 || !u2) return false;
  const id1 = typeof u1 === "string" ? u1 : String(u1._id || u1.id || "");
  const id2 = typeof u2 === "string" ? u2 : String(u2._id || u2.id || "");
  return id1 && id2 && id1 === id2;
};

const idOf = (user) => String(typeof user === "string" ? user : user._id || user.id);
const STATUSES = [{ value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }];

export default function ProjectModal({ project, onClose, onSaved }) {
  const editing = Boolean(project);
  const manageTeam = !editing || canManageMembers(project.myRole);

  const [form, setForm] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "ACTIVE",
  });

  const [file, setFile] = useState(null);
  const [coverKey, setCoverKey] = useState(project?.coverImage ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Directly store full user objects in state (no caching/ID lookup needed)
  const [selectedMembers, setSelectedMembers] = useState(() =>
    Array.isArray(project?.members) ? project.members : []
  );

  // user id -> role; people from before roles existed count as the default role
  const initialRoles = () => Object.fromEntries(
    (Array.isArray(project?.members) ? project.members : []).map((m) => [idOf(m), project?.memberRoles?.[idOf(m)] ?? DEFAULT_ROLE]),
  );
  const [roles, setRoles] = useState(initialRoles);
  const roleFor = (user) => roles[idOf(user)] ?? DEFAULT_ROLE;

  // User search/picker state
  const [users, setUsers] = useState([]);
  const [searchKey, setSearchKey] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [userMeta, setUserMeta] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Resolve current cover image key to URL for preview
  const currentCoverUrl = useViewUrl(coverKey);

  const totalPages = userMeta
    ? userMeta.totalPages ?? Math.ceil(userMeta.totalDocuments / userMeta.limit)
    : 1;

  // Fetch user list whenever page or search query changes
  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const result = await getUsers({
          pageNo,
          limit: 5,
          searchKey: searchKey.trim(),
        });

        if (cancelled) return;

        setUsers(result.data ?? []);
        setUserMeta(result.meta ?? null);
      } catch (err) {
        if (!cancelled) {
          setUsersError(err.message || "Could not load users");
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [pageNo, searchKey]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !loading && !uploading) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, uploading, onClose]);

  const change = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const changeImage = async (newFile) => {
    if (!newFile) return;

    setError("");
    setFile(newFile);
    setUploading(true);

    const previousKey = coverKey;

    try {
      const newKey = await uploadImage(newFile);
      setCoverKey(newKey);

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

  // Toggle full user object in selection
  const toggleUser = (user) => {
    setSelectedMembers((previous) => {
      const exists = previous.some((m) => isSameUser(m, user));
      if (exists) {
        return previous.filter((m) => !isSameUser(m, user));
      } else {
        setRoles((current) => ({ ...current, [idOf(user)]: current[idOf(user)] ?? DEFAULT_ROLE }));
        return [...previous, user];
      }
    });
  };

  // Remove member from chips
  const removeUser = (userToRemove) => {
    setSelectedMembers((previous) =>
      previous.filter((m) => !isSameUser(m, userToRemove))
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!coverKey) {
      setError("Please add a cover image");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Please select at least one project member");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const currentMemberIds = selectedMembers.map(
        (user) => (typeof user === "string" ? user : user._id || user.id)
      );

      const memberRoles = currentMemberIds.map((id) => ({ userId: String(id), role: roles[id] ?? DEFAULT_ROLE }));

      let payload = {};

      if (editing) {
        // --- UPDATE MODE: Include ONLY changed fields ---
        if (form.name !== (project.name ?? "")) {
          payload.name = form.name;
        }

        if (form.description !== (project.description ?? "")) {
          payload.description = form.description;
        }

        if (form.status !== (project.status ?? "ACTIVE")) {
          payload.status = form.status;
        }

        if (coverKey !== (project.coverImage ?? null)) {
          payload.coverImage = coverKey;
        }

        // Check if members selection changed
        const initialMemberIds = (
          Array.isArray(project.members) ? project.members : []
        ).map((m) => (typeof m === "string" ? m : m._id || m.id));

        const membersChanged =
          initialMemberIds.length !== currentMemberIds.length ||
          initialMemberIds.some((id, index) => id !== currentMemberIds[index]);

        if (membersChanged) {
          payload.members = currentMemberIds;
        }

        const before = initialRoles();
        if (membersChanged || currentMemberIds.some((id) => before[id] && before[id] !== (roles[id] ?? DEFAULT_ROLE))) {
          payload.memberRoles = memberRoles;
        }

        // If no field was modified, close modal without making an API call
        if (Object.keys(payload).length === 0) {
          onClose();
          return;
        }
      } else {
        // --- CREATE MODE: Send all required fields ---
        payload = {
          ...form,
          coverImage: coverKey,
          members: currentMemberIds,
          memberRoles,
        };
      }

      if (editing) {
        await updateProject(project._id || project.id, payload);
      } else {
        await createProject(payload);
      }

      onSaved(editing ? "Project updated" : "Project created");
    } catch (err) {
      setError(err.message || "Could not save project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !loading && !uploading && onClose()
      }
    >
      <form
        className="modal modal--project"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit project" : "New project"}
      >
        <header>
          <div>
            <h2>{editing ? "Edit project" : "New project"}</h2>
            <p>
              {editing
                ? "Update the details below."
                : "Give your project a name and a cover."}
            </p>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            disabled={loading || uploading}
            aria-label="Close"
          >
            <Close />
          </button>
        </header>

        <div className="pm">
          {/* ---------- left: the project ---------- */}
          <section className="pm__details stack">
            <div>
              <span className="field__label">Cover image</span>
              <ImageDrop
                file={file}
                url={!file ? currentCoverUrl : undefined}
                onChange={changeImage}
                onError={setError}
                label={uploading ? "Uploading image…" : editing ? "Replace cover image" : "Upload a cover image"}
              />
            </div>

            <label className="field">
              <span className="field__label">Project name</span>
              <span className="field__box">
                <input name="name" placeholder="Website redesign" value={form.name} onChange={change} required autoFocus={!editing} />
              </span>
            </label>

            <label className="field">
              <span className="field__label">Description</span>
              <span className="field__box">
                <textarea name="description" rows={3} placeholder="What is this project about?" value={form.description} onChange={change} required />
              </span>
            </label>

            <div className="field">
              <span className="field__label">Status</span>
              <div className="seg pm__status" role="radiogroup" aria-label="Status">
                {STATUSES.map((st) => (
                  <button type="button" key={st.value} role="radio" aria-checked={form.status === st.value}
                    className={form.status === st.value ? "is-on" : ""}
                    onClick={() => setForm((previous) => ({ ...previous, status: st.value }))}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="notice notice--error">{error}</p>}
          </section>

          {/* ---------- right: the team ---------- */}
          <aside className="pm__team">
            <div className="pm__head">
              <h3>Team</h3>
              <span className="count">{selectedMembers.length}</span>
            </div>
            <p className="hint pm__hint">{manageTeam ? "New people get an invitation and join with this role once they accept." : "Only an admin can change the team."}</p>

            {selectedMembers.length === 0 ? (
              <div className="pm__empty">
                <Users width={22} height={22} />
                <span>Add at least one person from the list below.</span>
              </div>
            ) : (
              <ul className="pm__members">
                {selectedMembers.map((user) => {
                  const name = user.name || user.email || "Unnamed user";
                  return (
                    <li className="pm__member" key={idOf(user)}>
                      <UserAvatar user={user} size={34} />
                      <span className="member-info">
                        <strong>{name}</strong>
                        <small>{user.email}</small>
                      </span>
                      {manageTeam ? (
                        <>
                          <RolePicker name={name} value={roleFor(user)} disabled={loading}
                            onChange={(role) => setRoles((current) => ({ ...current, [idOf(user)]: role }))} />
                          <button type="button" className="icon-btn icon-btn--danger pm__remove" onClick={() => removeUser(user)}
                            disabled={loading} aria-label={`Remove ${name}`} title="Remove">
                            <Close width={15} height={15} />
                          </button>
                        </>
                      ) : <span className="pm__role">{roleLabel(roleFor(user))}</span>}
                    </li>
                  );
                })}
              </ul>
            )}

            {manageTeam && (
            <div className="pm__add">
              <span className="field__label">Add people</span>
              <label className="search pm__search">
                <Search width={16} height={16} />
                <input type="search" placeholder="Search by name or email…" value={searchKey} disabled={loading}
                  aria-label="Search users"
                  onChange={(e) => { setSearchKey(e.target.value); setPageNo(1); }} />
              </label>

              <div className={`pm__people ${usersLoading ? "is-loading" : ""}`}>
                {usersError ? (
                  <p className="notice notice--error">{usersError}</p>
                ) : !usersLoading && users.length === 0 ? (
                  <p className="hint member-message">No one found.</p>
                ) : (
                  users.map((user) => {
                    const checked = selectedMembers.some((m) => isSameUser(m, user));
                    return (
                      <button type="button" className={`pm__person ${checked ? "is-added" : ""}`} key={idOf(user)}
                        onClick={() => toggleUser(user)} disabled={loading} aria-pressed={checked}>
                        <UserAvatar user={user} size={34} />
                        <span className="member-info">
                          <strong>{user.name || "Unnamed user"}</strong>
                          <small>{user.email}</small>
                        </span>
                        <span className="pm__toggle">{checked ? <Check width={15} height={15} /> : <Plus width={15} height={15} />}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {totalPages > 1 && (
                <div className="member-pagination">
                  <span>{pageNo} / {totalPages}</span>
                  <div className="member-pagination__actions">
                    <button type="button" className="btn btn--ghost" disabled={pageNo <= 1 || usersLoading || loading}
                      onClick={() => setPageNo((page) => Math.max(1, page - 1))}>Previous</button>
                    <button type="button" className="btn btn--ghost" disabled={usersLoading || loading || pageNo >= totalPages}
                      onClick={() => setPageNo((page) => page + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
            )}
          </aside>
        </div>

        <footer>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={loading || uploading}
          >
            Cancel
          </button>

          <button
            className="btn btn--primary"
            disabled={loading || uploading || usersLoading}
          >
            {loading ? (
              <span className="spinner" />
            ) : uploading ? (
              "Uploading image..."
            ) : editing ? (
              "Save changes"
            ) : (
              "Create project"
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}