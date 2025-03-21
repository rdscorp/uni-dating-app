import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
    persist(
        (set) => ({
            user: null,
            profileComplete: null, // New state for profile completion
            setUser: (user) => set({ user }),
            setProfileComplete: (status) => set({ profileComplete: status }),
            logout: () => async () => {
                const { setUser, setProfileComplete } = useUserStore.getState();

                setUser(null);
                setProfileComplete(null); // ✅ Ensure profile state is cleared
                await auth.signOut();
            }
        }),
        { name: "user-auth" } // Saves state to localStorage
    )
);

export default useUserStore;
