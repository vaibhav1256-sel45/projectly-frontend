import { NavLink } from "react-router-dom";
import { BarChart, Columns } from "../common/Icons.jsx";

// Title + Board/Dashboard tabs, shared by the two pages of a project
export default function ProjectHeader({ projectId, state, name, meta, children }) {
  return (
    <section className="phead">
      <div className="phead__top">
        <div className="phead__title">
          <h1>{name || "Project"}</h1>
          {meta && <div className="phead__meta">{meta}</div>}
        </div>
        <div className="page__actions">{children}</div>
      </div>
      <nav className="phead__tabs" aria-label="Project">
        <NavLink to={`/tasks/${projectId}/board`} state={state}><Columns width={16} height={16} />Board</NavLink>
        <NavLink to={`/tasks/${projectId}/dashboard`} state={state}><BarChart width={16} height={16} />Dashboard</NavLink>
      </nav>
    </section>
  );
}
