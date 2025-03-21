import { auth, db } from "../../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import useUserStore from "../../store/useUserStore";
import { FcGoogle } from "react-icons/fc";
import uNiLogo from "../../assets/uNi.png";
import { useNavigate } from "react-router-dom";


const Login = () => {
    const navigate = useNavigate();

    const { setUser } = useUserStore();

    const handleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    profilePic: user.photoURL,
                    university: "",
                    gender: "",
                    interestedIn: "",
                    bio: "",
                });
                navigate("/setup-profile");
            } else {
                navigate("/home");
            }

            setUser(user);
        } catch (error) {
            console.error("Login Error:", error.message);
        }
    };

    return (
        <div className="app-container">
            <img src={uNiLogo} className="app-logo" />
            <h1 className="title2">CONNECT • MATCH • CHAT</h1>
            <button
                onClick={handleLogin}
                className="btn-primary"
                style={{ marginTop: "2rem" }}
            >
                <FcGoogle size={30} />
                Sign in with Google
            </button>
            <h1 className="title4" style={{ marginTop: "4rem", color: '#909090' }}>FAQ • CONTACT • GUIDELINES</h1>
            <p className="links" style={{ marginTop: "1rem" }}><span className="link">Privacy Policy</span> • <span className="link">Terms & Conditions</span><br />Copyright © 2025 RDS Corp. All rights reserved</p>
        </div>
    );
};

export default Login;
