import { useEffect, useState } from "react";
import { listProjects } from "../api/index.js";

// The project's name and the current user's role in it: from the link that opened the page,
// or looked up in the project list when the page was opened directly.
export default function useProject(projectId, state) {
  const [project, setProject] = useState({ name: state?.name ?? "", myRole: state?.myRole });
  useEffect(() => {
    if (state?.name && state?.myRole) return setProject({ name: state.name, myRole: state.myRole });
    let alive = true;
    listProjects({ pageNo: 1, limit: 50 })
      .then((res) => {
        const p = (res.data ?? []).find((x) => String(x._id || x.id) === String(projectId));
        if (alive && p) setProject({ name: p.name, myRole: p.myRole });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [projectId, state?.name, state?.myRole]);
  return project;
}
