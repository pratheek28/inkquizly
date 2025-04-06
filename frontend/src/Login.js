import { useState } from "react";
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import NavigationBar from "./NavigationBar"

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [response, setResponse] = useState("");

    const handleVarChange = (e) => {
        try {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        } catch (err) {
            console.error("Error updating formData:", err);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('http://127.0.0.1:5000/getLoginDetails', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            setResponse(data.message);
            if (data.message.includes("Success:")) {
                navigate("/AccountDashboard", { state: { user: data.user } });
            }
        })
        .catch(error => {
            console.error("Error:", error);
            setResponse("An Error occurred while submitting the form.");
        });
    };
 
    return (
        <div>
            <NavigationBar />
            <form onSubmit={handleSubmit} className={styles.form_container} >
                <h1>Log In!</h1>

                <div>
                    <input onChange={handleVarChange}
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                    />
                </div>

                <div>
                    <input onChange={handleVarChange}
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password} 
                    />
                </div>

                <div>
                    <button type="submit">Log In!</button>
                </div>
                {response && <p style= {{ marginTop: "1rem", color: response.includes("Error") ? "red" : "green"}}>{response}</p>}
            </form>
        </div>
    );
}

export default Login;