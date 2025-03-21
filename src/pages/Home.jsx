import { useState, useEffect } from "react";
import SwipeCard from "../components/Swipe/SwipeCard";
import { auth, db } from "../firebase";
import Logout from "../components/Auth/Logout";
import uNiLogo from "../assets/uNi.png";
import { FcLike, FcSettings, FcSms } from "react-icons/fc";
import {
    collection,
    query,
    where,
    getDocs,
    limit,
    getCountFromServer,
    getDoc,
    doc,
    updateDoc,
    arrayRemove,
    arrayUnion,
    setDoc
} from "firebase/firestore";

const Home = () => {
    // State variables
    const [profiles, setProfiles] = useState([]); // Current profiles to display
    const [remainingProfiles, setRemainingProfiles] = useState([]); // Queued profiles
    const [user, setUser] = useState(null); // Current user data
    const [likeLimit, setLikeLimit] = useState(0); // Maximum likes allowed
    const [currentLikes, setCurrentLikes] = useState(0); // Current likes count
    const [likeCount, setLikeCount] = useState(0); // Number of people who liked the user
    const [matchCount, setMatchCount] = useState(0); // Number of people who liked the user
    const [FBUser, setFBUser] = useState(null); // Firebase auth user
    const [changeNeed, setChangeNeed] = useState(null); // Trigger for UI updates
    const [catalogVisited, setCatalogVisited] = useState(false); // Track if entire catalog has been viewed

    // Listen for authentication state changes
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

    // Fetch user data when auth state changes
    useEffect(() => {
        const fetchUserData = async () => {
            const userId = auth.currentUser?.uid;
            console.log("Current user ID:", userId);
            if (!userId) return;

            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userInfo = {
                    uid: userId,
                    university: userData.university,
                    interestedIn: userData.interestedIn === "Women" ? "Female" : "Male",
                    matches: userData.matches || [], // Store matches array
                    visited_profiles: userData.visited_profiles || [] // Store visited profiles
                };

                setUser(userInfo);
                setLikeCount(userData.likedBy?.length || 0);
                await fetchProfiles(userInfo); // Fetch profiles after user state is updated
            }
        };

        fetchUserData();
    }, [FBUser]);

    // Update like count when needed
    useEffect(() => {
        if (!user) return;

        const fetchLikeCount = async () => {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setLikeCount(userData.likedBy?.length || 0);
                setMatchCount(userData.matches?.length || 0);
            }
        };

        fetchLikeCount();
    }, [user, currentLikes, changeNeed]); // Listen to likes and explicit change triggers

    /**
     * Fetch profiles based on user preferences
     * - Excludes user's own profile
     * - Excludes already visited profiles unless catalog is exhausted
     * - Excludes profiles the user has matched with
     */
    const fetchProfiles = async ({ university, interestedIn, uid, matches = [], visited_profiles = [] }) => {
        console.log("Fetching profiles with params:", { university, interestedIn, uid });

        // Get total count of eligible profiles
        const totalCountQuery = query(
            collection(db, "users"),
            where("gender", "==", interestedIn),
            where("university", "==", university),
            where("uid", "!=", uid)
        );

        const totalCountSnap = await getCountFromServer(totalCountQuery);
        const totalProfiles = totalCountSnap.data().count;
        console.log(`Total eligible profiles: ${totalProfiles}`);

        // Set like limit to total number of profiles
        const likeLimitCalculated = Math.ceil(totalProfiles * 1);
        setLikeLimit(likeLimitCalculated);

        // Check if we need to refresh the catalog
        // If visited_profiles count equals or exceeds total profiles, we've seen everyone
        if (visited_profiles.length >= totalProfiles) {
            console.log("📋 Entire catalog has been viewed. Refreshing visited profiles.");
            // Reset visited profiles in user document to allow seeing profiles again
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, { visited_profiles: [] });
            visited_profiles = []; // Reset locally as well
            setCatalogVisited(true); // Mark that we've gone through the entire catalog once
        } else {
            setCatalogVisited(false);
        }

        // Fetch profiles that match preferences
        let profilesQuery = query(
            collection(db, "users"),
            where("gender", "==", interestedIn),
            where("university", "==", university),
            where("uid", "!=", uid),
            limit(50)
        );

        const querySnapshot = await getDocs(profilesQuery);

        // Process results, filtering out matched profiles and visited ones
        let newProfiles = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(profile => !matches.includes(profile.uid)) // Exclude matches
            .filter(profile => profile.uid !== uid); // Double-check to exclude own profile

        // Special case: check if user has received likes from any potential matches
        // that they previously disliked, and include them in the profiles
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const likedBy = userData.likedBy || [];

            // If a user who previously liked me is in my visited_profiles,
            // I should see them again even if they're in visited_profiles
            const priorityProfiles = newProfiles.filter(profile =>
                likedBy.includes(profile.uid) && visited_profiles.includes(profile.uid)
            );

            // Regular profiles (not visited yet or not matches)
            const regularProfiles = newProfiles.filter(profile =>
                !visited_profiles.includes(profile.uid) && !priorityProfiles.some(p => p.uid === profile.uid)
            );

            // Combine priorityProfiles first, then regular profiles
            newProfiles = [...priorityProfiles, ...regularProfiles];
        }

        console.log(`Filtered profiles count: ${newProfiles.length}`);
        console.log(`Priority profiles count: ${newProfiles.filter(p => userSnap.exists() && userSnap.data().likedBy?.includes(p.uid)).length}`);

        if (newProfiles.length === 0 && !catalogVisited) {
            console.log("⚠️ No profiles available. Consider refreshing the catalog.");
        }

        // Update state with the first 10 profiles and save the rest
        setProfiles(newProfiles.slice(0, 10));
        setRemainingProfiles(newProfiles.slice(10));
    };

    /**
     * Rotate the catalog to show new profiles when current set is exhausted
     * Only shows profiles that:
     * - Match user's preferences
     * - Are not the user's own profile
     * - Are not profiles the user already matched with
     */
    const rotateCatalog = async () => {
        if (!user) return;

        console.log("🔄 Rotating catalog...");

        // Get updated user data to check latest matches and visited profiles
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User document not found during catalog rotation");
            return;
        }

        const userData = userSnap.data();
        const matches = userData.matches || [];
        const visited_profiles = userData.visited_profiles || [];

        // Fetch profiles with updated filters
        const refreshedProfilesQuery = query(
            collection(db, "users"),
            where("gender", "==", user.interestedIn),
            where("university", "==", user.university),
            where("uid", "!=", user.uid),
            limit(50)
        );

        const querySnapshot = await getDocs(refreshedProfilesQuery);

        // Filter profiles
        let refreshedProfiles = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(profile => !matches.includes(profile.uid)) // Exclude matches
            .filter(profile => profile.uid !== user.uid); // Exclude own profile

        // Special case: include profiles that have liked the user (potential matches)
        // even if they were previously visited
        const likedBy = userData.likedBy || [];

        const priorityProfiles = refreshedProfiles.filter(profile =>
            likedBy.includes(profile.uid) && visited_profiles.includes(profile.uid)
        );

        const regularProfiles = refreshedProfiles.filter(profile =>
            !visited_profiles.includes(profile.uid) && !priorityProfiles.some(p => p.uid === profile.uid)
        );

        // Combine with priority profiles first
        refreshedProfiles = [...priorityProfiles, ...regularProfiles];

        console.log(`Rotated profiles count: ${refreshedProfiles.length}`);

        // Update state
        setProfiles(refreshedProfiles.slice(0, 10));
        setRemainingProfiles(refreshedProfiles.slice(10));
    };

    /**
     * Handle swipe actions (like or dislike)
     * - Updates visited profiles
     * - Handles matches
     * - Removes likes when appropriate
     * - Shows appropriate alerts
     */
    const handleSwipe = async (direction, profile) => {
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const profileRef = doc(db, "users", profile.uid);

        // Mark profile as visited regardless of swipe direction
        await updateDoc(userRef, {
            visited_profiles: arrayUnion(profile.uid)
        });

        if (direction === "like") {
            // Check like limit
            if (currentLikes >= likeLimit) {
                alert("⚠️ You have reached your daily like limit.");
                return;
            }

            // Add like to profile's likedBy array
            await updateDoc(profileRef, { likedBy: arrayUnion(user.uid) });
            setCurrentLikes(prev => prev + 1);

            // Check if this is a match (they previously liked me)
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().likedBy?.includes(profile.uid)) {
                // Create a unique chat slug
                const chatSlug = user.uid < profile.uid
                    ? `${user.uid}_${profile.uid}`
                    : `${profile.uid}_${user.uid}`;

                // Create match document
                await setDoc(doc(db, "matches", chatSlug), {
                    users: [user.uid, profile.uid],
                    chatSlug,
                    createdAt: new Date().toISOString()
                });

                // Add to matches array in both user documents
                await updateDoc(userRef, {
                    matches: arrayUnion(profile.uid),
                    likedBy: arrayRemove(profile.uid) // Remove from likedBy after matching
                });

                await updateDoc(profileRef, {
                    matches: arrayUnion(user.uid),
                    likedBy: arrayRemove(user.uid) // Remove from likedBy after matching
                });

                // Notify and redirect
                alert(`🎉 Match found! Start chatting now.`);
                window.location.href = `/chats/${chatSlug}`;
            }
        } else if (direction === "dislike") {
            // Record dislike
            await updateDoc(userRef, {
                dislikes: arrayUnion(profile.uid)
            });

            // Check if this person liked me before (missed potential match)
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().likedBy?.includes(profile.uid)) {
                // Remove their like from my likedBy array
                await updateDoc(userRef, { likedBy: arrayRemove(profile.uid) });
                setChangeNeed(Date.now());
                alert(`⚠️ You just missed a potential match!`);
            }
        }

        // Remove this profile from current display
        setProfiles(prev => prev.filter(p => p.uid !== profile.uid));

        // If profiles are low, add from remaining or fetch new ones
        if (remainingProfiles.length > 0) {
            // Take one from remaining profiles
            const nextProfile = remainingProfiles[0];
            setProfiles(prev => [...prev, nextProfile]);
            setRemainingProfiles(prev => prev.slice(1));
        } else if (profiles.length < 2) {
            // Almost out of profiles, rotate catalog
            rotateCatalog();
        }
    };

    return (
        <div className="app-container">
            <img src={uNiLogo} className="app-logo-left" alt="uNi Logo" />

            {/* Top navigation buttons */}
            <div className="buttons-div-top">
                <a href="/likes" className="likes-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <FcLike size={30} />{likeCount ? likeCount : null}
                </a>
                <a href="/chats" className="chats-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <FcSms size={30} />{matchCount ? matchCount : null}
                </a>
            </div>

            {/* Profile cards container */}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
            }}>
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

            {/* Footer */}
            <h1 className="title4" style={{ marginTop: "5rem", color: '#909090' }}>
                FAQ • CONTACT • GUIDELINES
            </h1>
            <p className="links" style={{ marginTop: "0.5rem", marginBottom: '1rem' }}>
                <span className="link">Privacy Policy</span> • <span className="link">Terms & Conditions</span>
                <br />
                Copyright © 2025 RDS Corp. All rights reserved
            </p>

            {/* Bottom navigation buttons */}
            <div className="buttons-div">
                <a href="/setup-profile" className="settings-button" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <FcSettings size={30} />Settings
                </a>
                <Logout />
            </div>
        </div>
    );
};

export default Home;