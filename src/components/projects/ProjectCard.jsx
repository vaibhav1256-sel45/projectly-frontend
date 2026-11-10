import { useNavigate } from "react-router-dom";
import { BarChart, Edit, Trash, Users } from "../common/Icons.jsx";
import UserAvatar from "../common/UserAvatar.jsx";
import useViewUrl from "../../hooks/useViewUrl.js";
import { timeAgo } from "../../utils/time.js";
import { DEFAULT_ROLE, canDelete, canEdit, roleLabel } from "../../constants/projectRoles.js";

const gradients = [
  "linear-gradient(135deg,#cfe9e5,#a9d3d6 55%,#c9d3f3)",
  "linear-gradient(135deg,#dfe3fb,#c3cdf5 55%,#f0d7ec)",
  "linear-gradient(135deg,#fde6d8,#f7cdb9 55%,#f6e3b8)",
  "linear-gradient(135deg,#dcefe1,#b9dcc6 55%,#cde1f5)",
  "linear-gradient(135deg,#e2eef9,#c3dbf2 55%,#d9d2f4)",
];

// Same project -> same fallback gradient
const gradientFor = (id = "") => gradients[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length];

const MAX_AVATARS = 3;

export default function ProjectCard({ project, index = 0, onEdit, onDelete }) {
  const navigate = useNavigate();
  const cover = useViewUrl(project.coverImage);
  const active = project.status === "ACTIVE";
  const projectId = project._id || project.id;

  const members = Array.isArray(project.members) ? project.members : [];
  const extra = members.length - MAX_AVATARS;

  const open = () => projectId && navigate(`/tasks/${projectId}/board`, { state: { name: project.name, myRole: project.myRole } });
  // the buttons on the cover must not also open the board
  const tool = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <article className="card spot tilt" data-tilt="4" style={{ "--i": Math.min(index, 8) }} onClick={open} tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && open()}
      aria-label={`Open ${project.name}`}>
      <div className="card__cover" style={cover ? undefined : { background: gradientFor(projectId) }}>
        {cover ? <img src={cover} alt="" loading="lazy" /> : <span className="card__initial">{project.name?.[0]?.toUpperCase()}</span>}

        <div className="card__tools">
          <button type="button" className="card__tool" title="Dashboard" aria-label={`${project.name} dashboard`}
            onClick={tool(() => navigate(`/tasks/${projectId}/dashboard`, { state: { name: project.name, myRole: project.myRole } }))}>
            <BarChart width={17} height={17} />
          </button>
          {canEdit(project.myRole) && (
            <button type="button" className="card__tool" title="Edit" aria-label={`Edit ${project.name}`} onClick={tool(() => onEdit(project))}>
              <Edit width={17} height={17} />
            </button>
          )}
          {canDelete(project.myRole) && (
            <button type="button" className="card__tool card__tool--danger" title="Delete" aria-label={`Delete ${project.name}`} onClick={tool(() => onDelete(project))}>
              <Trash width={17} height={17} />
            </button>
          )}
        </div>
      </div>

      <div className="card__body">
        <div className="card__row">
          <h3>{project.name}</h3>
          <span className={`status ${active ? "status--active" : "status--archived"}`}>
            <i />{active ? "Active" : "Archived"}
          </span>
        </div>
        {project.description && <p className="card__desc">{project.description}</p>}

        <div className="card__foot">
          {members.length > 0 ? (
            <div className="avatar-stack">
              {members.slice(0, MAX_AVATARS).map((m, i) => (
                <span key={typeof m === "object" ? m._id || m.id || i : i} className="avatar-stack__item"
                  title={typeof m === "object" ? `${m.name || m.email} · ${roleLabel(project.memberRoles?.[m._id || m.id] ?? DEFAULT_ROLE)}` : ""}>
                  <UserAvatar user={typeof m === "object" ? m : { name: String(m) }} size={26} />
                </span>
              ))}
              {extra > 0 && <span className="avatar-stack__more">+{extra}</span>}
              <span className="card__members-label">{members.length} {members.length === 1 ? "member" : "members"}</span>
            </div>
          ) : (
            <span className="card__no-members"><Users width={15} height={15} />Just you</span>
          )}
          <time className="card__time" dateTime={project.updatedAt || project.createdAt}>
            {timeAgo(project.updatedAt || project.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
}
