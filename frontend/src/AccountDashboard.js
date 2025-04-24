import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavigationBar from "./NavigationBar"
import styles from "./AccountDashboard.module.css"

function AccountDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user;
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);


    useEffect(() => {
        if (!user) {
            navigate("/LogIn");
        }
    }, [user, navigate]);

    if (!user) return null;

    const handleOptionClick = (option) => {
        setSelectedOption(option);
    };    

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("https://inkquizly.onrender.com/getNotes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedOption)
        })
        .then(data => {
            if (data.message.includes("SUCCEESS")) {
                navigate("/CanvasEditor", { state: { notes: data.notes } });
            }
        });
    };

    const handleNew = (e) => {
        navigate("/CanvasEditor");
    };

    return (
        <div className={styles.buttonRowWrapper}>
            <NavigationBar/>
        <div className={styles.buttonRow}>
            <button onClick={(handleNew)}>New!</button>
            <button onClick={() => setShowDropdown(!showDropdown)}>
                Open previous notes
            </button>
        </div>

        {showDropdown && (
            <div className={styles.dropdown}>
                <a className={styles.option} onClick={() => {handleOptionClick(user.name); handleSubmit()}}>{user.name}</a><br />
                {/* Repeat above for the following: */}
                <a className={styles.option}>{user.email}</a><br />
                <a className={styles.option}>{user.password}</a>
            </div>
        )}
        </div>
    );
}

export default AccountDashboard;
