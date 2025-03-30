import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./components/Auth/Login";
import PrivateRoute from "./components/Auth/PrivateRoute";
import { AuthProvider } from "./hooks/useAuth"; // Ensure AuthProvider is used
import useAuthListener from "./hooks/useAuthListener";
import UserDetailsForm from "./pages/UserDetailsForm";
import Likes from "./pages/Likes";
import ChatPage from "./pages/Chat";
import ChatBox from "./pages/ChatBox"; // Import ChatBox
import { Analytics } from "@vercel/analytics/react"
const App = () => {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/setup-profile" element={<PrivateRoute><UserDetailsForm /></PrivateRoute>} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/likes" element={<PrivateRoute><Likes /></PrivateRoute>} />
            <Route path="/chats" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/chats/:chatSlug" element={<PrivateRoute><ChatBox /></PrivateRoute>} />
          </Routes>
        </Router>
        <Analytics />
      </AuthWrapper>
    </AuthProvider>
  );
};

// Wrapper to sync Firebase auth with Zustand store
const AuthWrapper = ({ children }) => {
  useAuthListener();
  return children;
};

export default App;
