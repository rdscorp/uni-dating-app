import { useEffect } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import useUserStore from "../store/useUserStore";

const useAuthListener = () => {
  const { setUser, setProfileComplete } = useUserStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);

        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          setProfileComplete(userSnap.exists() ? userSnap.data().profileComplete : false);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfileComplete(false);
        }
      } else {
        setUser(null);
        setProfileComplete(null); // ✅ Reset profile status on logout
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfileComplete]);
};

export default useAuthListener;
