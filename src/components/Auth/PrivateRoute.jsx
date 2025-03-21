import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useUserStore from "../../store/useUserStore";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth(); // 🔥 Ignore `loading`, just check `user`
  const { profileComplete } = useUserStore();

  if (!user) return <Navigate to="/" replace />; // ✅ Instantly redirect on logout
  if (profileComplete === false) return <Navigate to="/setup-profile" replace />; // ✅ Redirect to profile setup

  return children ? children : <Outlet />;
};

export default PrivateRoute;
