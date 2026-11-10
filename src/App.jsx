import { Navigate, Route, Routes } from "react-router-dom";
import { getTokens } from "./utils/auth.js";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import Projects from "./pages/Projects.jsx";
import TaskBoard from "./pages/TaskBoard.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const Protected = ({ children }) => (getTokens() ? children : <Navigate to="/login" replace />);
const GuestOnly = ({ children }) => (getTokens() ? <Navigate to="/" replace /> : children);

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/verify" element={<VerifyOtp />} />
      <Route path="/" element={<Protected><Projects /></Protected>} />
      <Route path="/tasks/:projectId/board" element={<Protected><TaskBoard /></Protected>} />
      <Route path="/tasks/:projectId/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
