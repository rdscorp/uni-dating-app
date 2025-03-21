import { useContext, createContext } from "react";
import useUserStore from "../store/useUserStore";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext) || { user: null, loading: false }; // Default if not wrapped in AuthProvider
};

export const AuthProvider = ({ children }) => {
  const { user } = useUserStore(); // Get user from Zustand

  return (
    <AuthContext.Provider value={{ user, loading: user === null }}>
      {children}
    </AuthContext.Provider>
  );
};
