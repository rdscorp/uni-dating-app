import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { FcLike, FcSettings, FcSms } from "react-icons/fc";
import uNiLogo from "../assets/uNi.png";
import Logout from "../components/Auth/Logout";

const ChatBox = () => {
    const { chatSlug } = useParams();  // Get chatSlug from URL
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [FBUser, setFBUser] = useState(null);
    const [matchDetails, setMatchDetails] = useState(null);
    const chatEndRef = useRef(null); // Auto-scroll reference

    const [likeCount, setLikeCount] = useState(0);
    const [matchCount, setMatchCount] = useState(0);

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
        };

        fetchUserLikes();
    }, [FBUser]);

    useEffect(() => {
        if (!FBUser) return;

        // Fetch Match Details
        const fetchMatchDetails = async () => {
            const matchRef = doc(db, "matches", chatSlug);
            const matchSnap = await getDoc(matchRef);
            if (!matchSnap.exists()) return;

            const matchData = matchSnap.data();
            const otherUserId = matchData.users.find(uid => uid !== FBUser.uid);
            const otherUserRef = doc(db, "users", otherUserId);
            const otherUserSnap = await getDoc(otherUserRef);

            if (otherUserSnap.exists()) {
                setMatchDetails({ uid: otherUserId, ...otherUserSnap.data() });
            }
        };

        fetchMatchDetails();
    }, [FBUser, chatSlug]);

    useEffect(() => {
        if (!FBUser) return;

        const messagesRef = collection(db, `chats/${chatSlug}/messages`);
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [FBUser, chatSlug]);

    const sendMessage = async () => {
        if (newMessage.trim() === "" || !FBUser) return;

        const messagesRef = collection(db, `chats/${chatSlug}/messages`);
        await addDoc(messagesRef, {
            text: newMessage,
            sender: FBUser.uid,
            receiver: matchDetails?.uid,
            timestamp: serverTimestamp(),
            read: false,
        });

        setNewMessage("");  // Clear input
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Auto-scroll
    }, [messages]);

    return (
        <div className="app-container">
            {/* Logo & Top Buttons */}
            <img src={uNiLogo} style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/home'} className="app-logo-left" />
            <div className="buttons-div-top">
                <a href="/likes" className="likes-button"><FcLike size={30} />{likeCount ? likeCount : null}</a>
                <a href="/chats" className="chats-button"><FcSms size={30} />{matchCount ? matchCount : null}</a>
            </div>

            {/* Match Info */}
            {matchDetails && (
                <div className="match-header">
                    <img src={matchDetails.photos?.[0] || "/default-avatar.jpg"} alt={matchDetails.name} className="match-photo-large" />
                    <h2>{matchDetails.name.split(" ")[0]}, {matchDetails.age}</h2>
                </div>
            )}

            {/* Chat Container */}
            <div className="chat-container">
                <div className="messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender === FBUser?.uid ? "sent" : "received"}`}>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    <div ref={chatEndRef} /> {/* Keeps chat scrolled to bottom */}
                </div>

                {/* Input Box */}
                <div className="input-container">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()} // Send on Enter
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
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

export default ChatBox;
