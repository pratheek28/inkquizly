import { useState } from "react";
import styles from './SignUp.module.css';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:5000/getSignUpDetails", {
      method: "POST",
      credentials: 'include',
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
      setResponse("An error occurred while submitting the form.");
    });
  };

  return (
    <div>
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
          <button type="submit">Create Account</button>
        </div>
        {response && <p style={{ marginTop: "1rem", color: response.includes("Successfully") ? "green" : "red"}}>{response}</p>}
      </form>
    </div>
  );


}

export default SignUp;
