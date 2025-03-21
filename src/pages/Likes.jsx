import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import Logout from "../components/Auth/Logout";
import uNiLogo from "../assets/uNi.png";
import { FcLike, FcSettings, FcSms } from "react-icons/fc";
import { collection, getDoc, doc } from "firebase/firestore";
import BlurredProfileCard from "../components/BlurredProfileCard";

const Likes = () => {
    const [profiles, setProfiles] = useState([]);
    const [user, setUser] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [matchCount, setMatchCount] = useState(0);
    const [FBUser, setFBUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                setFBUser({ uid: firebaseUser.uid });
            } else {
                setFBUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!FBUser) return;

        const fetchUserLikes = async () => {
            const userRef = doc(db, "users", FBUser.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return;

            const userData = userSnap.data();
            setLikeCount(userData.likedBy?.length || 0);
            setMatchCount(userData.matches?.length || 0);

            if (userData.likedBy?.length) {
                // Fetch details of users who liked the current user
                const likedUsers = await Promise.all(
                    userData.likedBy.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, "users", uid));
                        return userDoc.exists() ? { uid, ...userDoc.data() } : null;
                    })
                );

                setProfiles(likedUsers.filter(Boolean)); // Filter out null values
            }
        };

        fetchUserLikes();
    }, [FBUser]);

    return (
        <div className="app-container">
            <img src={uNiLogo} style={{
                cursor: 'pointer'
            }} onClick={() => window.location.href = '/home'} className="app-logo-left" />
            <div className="buttons-div-top">
                <a href="/likes" className="likes-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}><FcLike size={30} />{likeCount ? likeCount : null}</a>
                <a href="/chats" className="chats-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}><FcSms size={30} />{matchCount ? matchCount : null}</a></div>
            <h2 className="title2">Liked You</h2>

            <div className="profile-list" style={{
                height: '55vh', display: 'flex', gap: '0.5em', flexWrap: 'wrap',
                padding: '1em'
            }}>
                {profiles.length > 0 ? (
                    profiles.map((profile) => (
                        <BlurredProfileCard key={profile.uid} profile={profile} />
                    ))
                ) : (
                    <p className="no-likes">No Likes Yet</p>
                )}
            </div>




            <h1 className="title4" style={{ marginTop: "5rem", color: '#909090' }}>FAQ • CONTACT • GUIDELINES</h1>
            <p className="links" style={{ marginTop: "0.5rem", marginBottom: '1rem' }}><span className="link">Privacy Policy</span> • <span className="link">Terms & Conditions</span><br />Copyright © 2025 RDS Corp. All rights reserved</p>

            <div className="buttons-div">
                <a href="/setup-profile" className="settings-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}><FcSettings size={30} />Settings</a><Logout /></div>
        </div>
    );
};

export default Likes;
