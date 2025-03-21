import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import useUserStore from "../store/useUserStore";
import uNiLogo from "../assets/uNi.png";
import Logout from "../components/Auth/Logout";
import { FcLike, FcSettings, FcSms } from "react-icons/fc";

const UserDetailsForm = () => {
    const { user } = useUserStore();
    const [formData, setFormData] = useState({
        name: user?.displayName || "",
        age: "",
        university: "",
        gender: "",
        interestedIn: "",
        bio: "",
        prompts: {
            "Fun Fact": "",
            "Weekend Plan": "",
        },
        photos: [],
    });

    const storage = getStorage();
    const [successMessage, setSuccessMessage] = useState("");
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

            setFormData({
                age: userData.age,
                gender: userData.gender,
                university: userData.university,
                interestedIn: userData.interestedIn,
                prompts: userData.prompts,
                bio: userData.bio,
                photos: userData.photos
            })

        };

        fetchUserLikes();
    }, [FBUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePromptChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            prompts: { ...formData.prompts, [name]: value },
        });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const storageRef = ref(storage, `users/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, downloadURL],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                age: formData.age,
                email: user.email,
                profilePic: user.photoURL,
                university: formData.university,
                gender: formData.gender,
                interestedIn: formData.interestedIn,
                bio: formData.bio,
                prompts: formData.prompts,
                photos: formData.photos,
            }, { merge: true });

            setSuccessMessage("Profile Updated Successfully!");
            setTimeout(() => { setSuccessMessage(""); window.location.href = "/home"; }, 1000); // Hide message after 3s
        } catch (error) {
            console.error("Error saving user details:", error);
        }
    };

    return (
        <div className="app-container">
            {/* Logo */}
            <img src={uNiLogo} onClick={() => { window.location.href = '/home' }} className="app-logo-left" />
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
            <h2 className="title2">Complete Your Profile</h2>
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '75vh',
                width: '90%',
                overflow: 'auto',
                background: '#303030',
                padding: '20px',
                borderRadius: '10px'
            }}>

                {successMessage && (
                    <div className="alert">
                        <span>{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form">
                    {/* Name */}
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Name"
                        className="input"
                    />

                    {/* Age */}
                    <input
                        type="text"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Your Age"
                        className="input"
                    />


                    {/* Gender */}
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="select"
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>

                    {/* Interested In */}
                    <select
                        name="interestedIn"
                        value={formData.interestedIn}
                        onChange={handleChange}
                        className="select"
                    >
                        <option value="">Interested In</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                    </select>

                    {/* University */}
                    <select
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        className="select"
                    >
                        <option value="">Select University</option>
                        <option value="bitjpr">Birla Institute of Technology, Jaipur</option>
                    </select>

                    {/* Bio */}
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us something about yourself..."
                        className="textarea"
                    ></textarea>

                    {/* Prompts */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label className="block font-medium">Fun Fact</label>
                        <input
                            type="text"
                            name="Fun Fact"
                            value={formData.prompts["Fun Fact"]}
                            onChange={handlePromptChange}
                            placeholder="Share a fun fact"
                            className="input"
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label className="block font-medium">Perfect Weekend</label>
                        <input
                            type="text"
                            name="Weekend Plan"
                            value={formData.prompts["Weekend Plan"]}
                            onChange={handlePromptChange}
                            placeholder="Describe your perfect weekend"
                            className="input"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label className="block font-medium">Upload Profile Pictures</label>
                        <input
                            type="file"
                            onChange={handlePhotoUpload}
                            className="file-input"
                        />
                        <div className="flex mt-2 gap-2">
                            {formData.photos.map((url, index) => (
                                <img key={index} src={url} alt="Profile" className="images" />
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="btn-primary" style={{ paddingLeft: "1rem" }}>
                        Save & Continue
                    </button>
                </form>
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

export default UserDetailsForm;
