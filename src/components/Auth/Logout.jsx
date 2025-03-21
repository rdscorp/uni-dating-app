import { FcCancel, FcDeleteRow, FcLeave } from "react-icons/fc";
import { auth } from "../../firebase";
import useUserStore from "../../store/useUserStore";

const Logout = () => {
  const { logout } = useUserStore();

  const handleLogout = async () => {
    await auth.signOut();
    logout();
  };

  return (
    <button onClick={handleLogout} className="logout-button" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }}>
        <FcCancel size={30} />
      Sign Out
    </button>
  );
};

export default Logout;
