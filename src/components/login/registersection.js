import React, { useState  } from "react";
import {  Link  } from 'react-router-dom';

export function RegisterSection({ onChangeSection }) {

    const [status, setStatus] = useState("");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [first_name, setFirstname] = useState("");
    const [last_name, setLastname] = useState("");
    const [role, setRole] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            username,
            email,
            password,
            first_name,
            last_name,
            role,
        };

        try {
            const response = await fetch("/user/register", {  
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify(formData),  
            });

            if (!response.ok) {
                const errorData = await response.json();
                setStatus(errorData.status)

            } else {
                const responseData = await response.json();
                setStatus(responseData.status)
            }

        } catch (error) {
            console.error("Network error:", error);
            setStatus("Network error, please try again later.");
        }
    };
    
    if (status == ""){
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Register</h1>
                    <p className="welcome-text">Fill out the form to create an account.</p>
                    <form onSubmit={handleSubmit}>
                        <input type="text" className="input-field" placeholder="Username" required pattern="^[a-zA-Z0-9]+" onChange={(e) => setUsername(e.target.value)} title="Username must only contain letters and numbers" />
                        <input type="email" className="input-field" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} />
                        <input type="password" className="input-field" placeholder="Password" minLength="8" required onChange={(e) => setPassword(e.target.value)}  />
                        <input type="text" className="input-field" placeholder="First Name" required onChange={(e) => setFirstname(e.target.value)} />
                        <input type="text" className="input-field" placeholder="Last Name" required onChange={(e) => setLastname(e.target.value)} />
                        <select className="input-field" required onChange={(e) => setRole(e.target.value)} >
                            <option value="">Select Role</option>
                            <option value="student">student</option>
                            <option value="faculty member">faculty member</option>
                        </select>
                        <button type="submit" className="login-button">Register</button>
                    </form>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        );
    }
    else {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Registration Form</h1>
                    <p className="registration-text"> {status} </p>
                    <Link onClick={() => setStatus("")}  to="/login">Back to Login</Link>
                </div>
            </div>
        );
    }
}
