import { motion } from "framer-motion";
import { useState } from "react";

const SwipeCard = ({ profile, index, onSwipe }) => {
    const [dragging, setDragging] = useState(false);
    const [swiped, setSwiped] = useState(false);

    return (
        <motion.div
            className="card"
            style={{ zIndex: 100 - index }} // Higher index = lower z-index
            drag="x"
            dragConstraints={{ left: 0, right: 0 }} // No constraints; fully draggable
            initial={{ x: 0 }}
            animate={{ x: swiped ? (swiped === "right" ? 500 : -500) : 0 }} // Animate off-screen if swiped
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onDragStart={() => setDragging(true)}
            onDragEnd={(event, info) => {
                setDragging(false);
                console.log(info.point.x);
                if (info.point.x > 200) {
                    setSwiped("right");
                    onSwipe("like", profile, index);
                } else if (info.point.x < -200) {
                    setSwiped("left");
                    onSwipe("dislike", profile, index);
                } else {
                    setSwiped(false); // Return to original position
                }
            }}
        >
            <img src={profile.photos[0]} className="card-image" />
            <h2 className="card-title">
                {profile.name.split(" ")[0]}, {profile.age}
            </h2>
            <div className="card-bio-container">
                <p className="card-bio-gender">{profile.gender}</p>
                <p className="card-bio-title">Bio</p>
                <p className="card-bio">{profile.bio}</p>
                {
                    Object.keys(profile.prompts).map((key, index) => {
                        return (<>
                            <p className="card-bio-title">{key}</p>
                            <p className="card-bio">{profile.prompts[key]}</p>
                        </>)
                    })
                }
            </div>
        </motion.div>
    );
};

export default SwipeCard;
