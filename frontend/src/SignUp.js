import { useState } from "react";
import styles from './SignUp.module.css';
import NavigationBar from "./NavigationBar"

function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [response, setResponse] = useState("");

  const handleVarChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch("https://inkquizly.onrender.com/getSignUpDetails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      setResponse(data.message);
    })
    .catch(error => {
      console.error("Error:", error);
      setResponse("An error occurred. Please try again later!");
    })
    .finally(() => {
      const baseUrl = "https://script.google.com/macros/s/AKfycbwCI2de5lhYdI-5QEeVcQHlHaypqkQgrLmdTLw8U6JPcvtwZRHGVts2Vm4QvPSn5bP7/exec";
      const params = new URLSearchParams({
        action: "addUser",
        name: formData.firstName+" "+formData.lastName,
        email: formData.email,
      });
    
      try {
        const response =  fetch(`${baseUrl}?${params.toString()}`);
        const result =  response.text();
        console.log("Server response:", result);
      } catch (error) {
        console.log("Error:", error);
      }
      setLoading(false);
  });
  };

  return (
    <div>
      <NavigationBar />
      <form onSubmit={handleSubmit} className={styles.form_container}>
        <h1>Sign Up!</h1>

        <div className="firstName">
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleVarChange}
          />
        </div>

        <div className="lastName">
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleVarChange}
          />
        </div>

        <div className="email">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleVarChange}
          />
        </div>

        <div className="password">
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleVarChange}
          />
        </div>

        <div className="password">
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleVarChange}
          />
        </div>

        <div className="submit">
        <button type="submit" disabled={loading}>
                    {loading ? "Incredible things take time, please wait..." : "Create Account"}
                </button>
          {/* <button type="submit">Create Account</button> */}
        </div>
        {response && <p style={{ marginTop: "1rem", color: response.includes("Successfully") ? "green" : "red"}}>{response}</p>}
      </form>
    </div>
  );


}

export default SignUp;
