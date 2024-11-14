import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from "react";

export function LoginSection() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = { username, password };

        try {
            const response = await fetch("/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setStatus(errorData.status);
                console.error("Login failed:", errorData.status);
            } else {
                const logged = await response.json();
                setStatus(logged.status);
                
                const token = response.headers.get("Authorization")?.replace("Bearer ", "");

                if (token) {
                    localStorage.setItem("token", token);
                    
                    navigate("/dashboard");
                }
            }
        } catch (error) {
            console.error("Network error:", error);
            setStatus("Network error, please try again later.");
        }
    };

    if (status === "") {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Login</h1>
                    <form id="loginForm" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="input-field"
                            id="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            className="input-field"
                            id="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-button">Login</button>
                    </form>
                    <div className="links">
                        <Link to="/forgotPassword">Forgot Password?</Link>
                        <Link to="/register">Register</Link>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Login</h1>
                    <p className="login-text">{status}</p>
                    <Link onClick={() => setStatus("")} to="/login">Back to Login</Link>
                </div>
            </div>
        );
    }
}
