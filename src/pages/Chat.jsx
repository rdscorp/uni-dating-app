import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";
import { FcLike, FcSettings, FcSms } from "react-icons/fc";
import uNiLogo from "../assets/uNi.png";
import Logout from "../components/Auth/Logout";

const ChatPage = () => {
    const [matches, setMatches] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [likeCount, setLikeCount] = useState(0);
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
        };

        fetchUserLikes();
    }, [FBUser]);

    useEffect(() => {
        if (!FBUser) return;

        const fetchMatches = async () => {
            const matchesRef = collection(db, "matches");
            const q = query(matchesRef, where("users", "array-contains", FBUser.uid));

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const matchData = await Promise.all(
                    snapshot.docs.map(async (matchDoc) => { // Renamed from 'doc' to 'matchDoc'
                        const match = matchDoc.data();
                        const otherUserId = match.users.find((uid) => uid !== FBUser.uid);
                        const otherUserRef = doc(db, "users", otherUserId);
                        const otherUserSnap = await getDoc(otherUserRef);

                        return otherUserSnap.exists()
                            ? { uid: otherUserId, ...otherUserSnap.data(), chatSlug: match.chatSlug }
                            : null;
                    })
                );


                setMatches(matchData.filter(Boolean));
            });

            return () => unsubscribe();
        };

        fetchMatches();
    }, [FBUser]);

    useEffect(() => {
        if (!FBUser) return;

        const fetchUnreadCounts = () => {
            matches.forEach((match) => {
                const messagesRef = collection(db, `chats/${match.chatSlug}/messages`);
                const q = query(messagesRef, where("read", "==", false), where("receiver", "==", FBUser.uid));

                onSnapshot(q, (snapshot) => {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [match.chatSlug]: snapshot.size, // Number of unread messages
                    }));
                });
            });
        };

        fetchUnreadCounts();
    }, [matches, FBUser]);

    return (
        <div className="app-container">
            <img src={uNiLogo} style={{
                cursor: 'pointer'
            }} onClick={() => window.location.href = '/home'} className="app-logo-left" />
            <div className="buttons-div-top">
                <a href="/setup-profile" className="likes-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}><FcLike size={30} />{likeCount ? likeCount : null}</a>
                <a href="/chats" className="chats-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}><FcSms size={30} /></a></div>
            <h2 className="title2">Your Matches</h2>
            <div style={{
                height: '55vh', display: 'flex', gap: '0.5em', flexWrap: 'wrap',
                padding: '1em'
            }}>
                {matches.length > 0 ? (
                    matches.map((match) => (
                        <Link to={`/chats/${match.chatSlug}`} key={match.chatSlug} className="match-card">
                            <img src={match.photos[0] || "/default-avatar.jpg"} alt={match.name} className="match-photo" />
                            <div>
                                <h3 className="match-name">{match.name.split(' ')[0]}, {match.age}</h3>
                                {unreadCounts[match.chatSlug] > 0 && (
                                    <span className="unread-badge">{unreadCounts[match.chatSlug]}</span>
                                )}
                            </div>
                        </Link>
                    ))
                ) : (
                    <h4>No matches yet!</h4>
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

export default ChatPage;
