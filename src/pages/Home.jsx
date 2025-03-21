import { useState, useEffect } from "react";
import SwipeCard from "../components/Swipe/SwipeCard";
import { auth, db } from "../firebase";
import Logout from "../components/Auth/Logout";
import uNiLogo from "../assets/uNi.png";
import { FcLike, FcSettings, FcSms } from "react-icons/fc";
import { collection, query, where, getDocs, limit, getCountFromServer, getDoc, doc, updateDoc, arrayRemove, arrayUnion, setDoc } from "firebase/firestore";

const Home = () => {

    const [profiles, setProfiles] = useState([]);
    const [remainingProfiles, setRemainingProfiles] = useState([]);
    const [user, setUser] = useState(null);
    const [likeLimit, setLikeLimit] = useState(0);
    const [currentLikes, setCurrentLikes] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [FBUser, setFBUser] = useState(null)
    const [changeNeed, setChangeNeed] = useState(null)

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            console.log("Auth state changed:", firebaseUser);
            if (firebaseUser) {
                setFBUser({ uid: firebaseUser.uid });
            } else {
                setFBUser(null);
            }
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            const userId = auth.currentUser?.uid;
            console.log(userId)
            if (!userId) return;

            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userInfo = {
                    uid: userId,
                    university: userData.university,
                    interestedIn: userData.interestedIn === "Women" ? "Female" : "Male",
                };

                setUser(userInfo);
                setLikeCount(userData.likedBy?.length || 0);
                await fetchProfiles(userInfo);  // Fetch profiles after user state is updated
            }
        };

        fetchUserData();
    }, [FBUser]);


    useEffect(() => {
        if (!user) return;

        const fetchLikeCount = async () => {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setLikeCount(userData.likedBy?.length || 0);
            }
        };

        fetchLikeCount();
    }, [user, currentLikes, changeNeed]); // Now listens to likes too



    const fetchProfiles = async ({ university, interestedIn, uid }) => {
        const totalCountQuery = query(
            collection(db, "users"),
            where("gender", "==", interestedIn),
            where("university", "==", university)
        );

        const totalCountSnap = await getCountFromServer(totalCountQuery);
        const totalProfiles = totalCountSnap.data().count;

        console.log(totalProfiles)

        // Set like limit (let's keep it 25% of total users)
        const likeLimitCalculated = Math.ceil(totalProfiles * 1);
        setLikeLimit(likeLimitCalculated);

        const userDoc = await getDoc(doc(db, "users", uid));
        const visitedProfiles = userDoc.exists() ? userDoc.data().visited_profiles || [] : [];

        const profilesQuery = query(
            collection(db, "users"),
            where("gender", "==", interestedIn),
            where("university", "==", university),
            limit(50)
        );

        const querySnapshot = await getDocs(profilesQuery);
        const newProfiles = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(profile => !visitedProfiles.includes(profile.uid));

        setProfiles(newProfiles.slice(0, 10));
        setRemainingProfiles(newProfiles.slice(10)); // Remaining profiles for further swipes
    };

    const handleSwipe = async (direction, profile) => {
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const profileRef = doc(db, "users", profile.uid);

        if (direction === "like") {
            if (currentLikes >= likeLimit) {
                alert("⚠️ You have reached your daily like limit.");
                return;
            }

            await updateDoc(profileRef, { likedBy: arrayUnion(user.uid) });
            setCurrentLikes(prev => prev + 1);

            const profileSnap = await getDoc(userRef);
            if (profileSnap.exists() && profileSnap.data().likedBy?.includes(profile.uid)) {
                const chatSlug = `${user.uid}_${profile.uid}`;
                await setDoc(doc(db, "matches", chatSlug), {
                    users: [user.uid, profile.uid],
                    chatSlug,
                });

                alert(`🎉 Match found! Start chatting now.`);
                window.location.href = `/chats/${chatSlug}`;
            }
        } else if (direction === "dislike") {
            await updateDoc(profileRef, { dislikes: arrayUnion(profile.uid) });
            const profileSnap = await getDoc(userRef);
            if (profileSnap.exists() && profileSnap.data().likedBy?.includes(profile.uid)) {
                const chatSlug = `${user.uid}_${profile.uid}`;
                await updateDoc(userRef, { likedBy: arrayRemove(profile.uid) });
                setChangeNeed(Date.now())
                alert(`⚠️ You just missed a potential match!`);
            }
        }

        setRemainingProfiles(prev => prev.filter(p => p.uid !== profile.uid));

        if (remainingProfiles.length <= 1) { // Ensure we fetch new profiles when the list is empty
            rotateCatalog();
        }
    };

    const rotateCatalog = async () => {
        if (!user) return;

        console.log("🔄 Rotating catalog...");

        const refreshedProfilesQuery = query(
            collection(db, "users"),
            where("gender", "==", user.interestedIn),
            where("university", "==", user.university),
            limit(10)
        );

        const querySnapshot = await getDocs(refreshedProfilesQuery);
        const refreshedProfiles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setProfiles(refreshedProfiles.slice(0, 10)); // Show first 10 profiles
        setRemainingProfiles(refreshedProfiles.slice(10)); // Store rest for later swipes
    };




    return (
        <div className="app-container">
            <img src={uNiLogo} className="app-logo-left" />
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
                }}><FcSms size={30} /></a></div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {profiles.length > 0 ? (
                    profiles.map((profile, index) => (
                        <SwipeCard
                            key={profile.uid}
                            profile={profile}
                            index={index}
                            onSwipe={handleSwipe}
                        />
                    ))
                ) : (
                    <p style={{ fontFamily: 'LeagueSpartan' }}>No more profiles available</p>
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

export default Home;
