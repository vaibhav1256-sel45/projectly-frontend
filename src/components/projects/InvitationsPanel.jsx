import { useCallback, useEffect, useState } from "react";
import { acceptInvitation, declineInvitation, listInvitations } from "../../api/index.js";
import { Check, Close, Folder } from "../common/Icons.jsx";
import useViewUrl from "../../hooks/useViewUrl.js";
import { roleLabel } from "../../constants/projectRoles.js";

const LIMIT = 3;

function Invitation({ invitation, onAnswer }) {
  const project = invitation.projectId;
  const cover = useViewUrl(project.coverImage);

  return (
    <li className="invite">
      <span className="invite__cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
        {!cover && <Folder width={18} height={18} />}
      </span>
      <div className="invite__text">
        <strong>{project.name}</strong>
        <small>{invitation.invitedByName} invited you to join as {roleLabel(invitation.role)}</small>
      </div>
      <div className="invite__actions">
        <button className="btn btn--ghost btn--sm" onClick={() => onAnswer(invitation._id, false)}>
          <Close width={15} height={15} />Decline
        </button>
        <button className="btn btn--primary btn--sm" onClick={() => onAnswer(invitation._id, true)}>
          <Check width={15} height={15} />Accept
        </button>
      </div>
    </li>
  );
}

// Pending project invitations of the logged-in user. Renders nothing when there are none.
export default function InvitationsPanel({ onAccepted, onMessage }) {
  const [invitations, setInvitations] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);

  const load = useCallback(async () => {
    const res = await listInvitations({ pageNo, limit: LIMIT });
    setInvitations(res.data);
    setTotal(res.meta.totalDocuments);
    // answered the last invitation on this page: go back one page
    if (res.data.length === 0 && pageNo > 1) setPageNo(pageNo - 1);
  }, [pageNo]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const answer = async (id, accept) => {
    try {
      const res = accept ? await acceptInvitation(id) : await declineInvitation(id);
      onMessage(res.message);
      if (accept) onAccepted();
    } catch (err) {
      onMessage(err.message);
    }
    load().catch(() => {});
  };

  if (total === 0) return null;

  const pages = Math.ceil(total / LIMIT);

  return (
    <section className="invites" aria-label="Project invitations">
      <h2>Invitations <span>{total}</span></h2>
      <ul>
        {invitations.map((i) => <Invitation key={i._id} invitation={i} onAnswer={answer} />)}
      </ul>
      {pages > 1 && (
        <nav className="pager">
          <button className="btn btn--ghost btn--sm" disabled={pageNo === 1} onClick={() => setPageNo(pageNo - 1)}>Previous</button>
          <span>Page {pageNo} of {pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={pageNo === pages} onClick={() => setPageNo(pageNo + 1)}>Next</button>
        </nav>
      )}
    </section>
  );
}
