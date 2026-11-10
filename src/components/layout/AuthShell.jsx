import { Check, Logo } from "../common/Icons.jsx";

const points = [
  "Move tasks across a board everyone can see",
  "Invite your team as viewers, editors or admins",
  "Know where every project stands from its dashboard",
];

// Floating mini task cards: a hint of what the product looks like
function Collage() {
  return (
    <div className="collage" aria-hidden="true">
      <div className="mini mini--a">
        <span className="mini__tag mini__tag--urgent">Urgent</span>
        <strong>Design the pricing page</strong>
        <div className="mini__foot"><span>Oct 21</span><i className="mini__av" style={{ background: "#4d7c0f" }}>AS</i></div>
      </div>
      <div className="mini mini--b">
        <span className="mini__tag mini__tag--review">In review</span>
        <strong>Refactor the auth module</strong>
        <div className="mini__bar"><i style={{ width: "72%" }} /></div>
      </div>
      <div className="mini mini--c">
        <span className="mini__tag mini__tag--done">Completed</span>
        <strong>Ship v2 to production</strong>
        <div className="mini__foot"><span>3 comments</span><i className="mini__av" style={{ background: "#e0603c" }}>PP</i></div>
      </div>
    </div>
  );
}

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth__hero">
        <div className="brand brand--light">
          <span className="brand__mark"><Logo /></span>
          Projectly
        </div>

        <div className="auth__pitch">
          <h2>Plan it, track it, <em>ship it</em> together.</h2>
          <ul>
            {points.map((p) => (
              <li key={p}><span><Check width={13} height={13} /></span>{p}</li>
            ))}
          </ul>
        </div>

        <Collage />
        <p className="auth__foot">© {new Date().getFullYear()} Projectly</p>
      </aside>
      <main className="auth__panel">
        <div className="auth__card spot tilt" data-tilt="2.5">{children}</div>
      </main>
    </div>
  );
}
