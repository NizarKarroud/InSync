import React, { useState } from "react";

function Welcome() {
    return (
        <div className="welcome-section">
            <h2 className="welcome-title">Welcome to InSync!</h2>
            <p className="welcome-text">
                Hello and welcome to InSync, the official chat platform for our university’s IT department! This is your space to collaborate, share insights, and stay connected with classmates and faculty members. Whether you’re discussing projects, seeking advice, or sharing resources, we’re here to support your academic journey. Jump in and start connecting!
            </p>
        </div>
    );
}

function LoginSection({ onChangeSection }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = { username, password };

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify(data), 
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Login failed:", error.message);
            } else {
                const result = await response.json();
                console.log("Login successful:", result);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

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
                    <a onClick={() => onChangeSection("forgotPassword")}>Forgot Password?</a>
                    <a onClick={() => onChangeSection("register")}>Register</a>
                </div>
            </div>
        </div>
    );
}

function ForgotPasswordSection({ onChangeSection }) {
    return (
        <div className="login-section">
            <div className="login-container">
                <h1>Forgot Password</h1>
                <p className="welcome-text" >Enter your email to reset your password.</p>
                <form>
                    <input type="email" className="input-field" placeholder="Email" required />
                    <button type="submit" className="login-button">Reset Password</button>
                </form>
                <button onClick={() => onChangeSection("login")} className="login-button">Back to Login</button>
            </div>
        </div>
    );
}

function RegisterSection({ onChangeSection }) {
    return (
        <div className="login-section">
            <div className="login-container">
                <h1>Register</h1>
                <p className="welcome-text">Fill out the form to create an account.</p>
                <form>
                    <input type="text" className="input-field" placeholder="Username" required />
                    <input type="email" className="input-field" placeholder="Email" required />
                    <input type="password" className="input-field" placeholder="Password" required />
                    <input type="text" className="input-field" placeholder="First Name" required />
                    <input type="text" className="input-field" placeholder="Last Name" required />
                    <select className="input-field" required>
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                    <button type="submit" className="login-button">Register</button>
                </form>
                <button onClick={() => onChangeSection("login")} className="login-button">
                    ← Back to Login
                </button>
            </div>
        </div>
    );
}

export function LoginPage() {
    const [section, setSection] = useState("login"); // Tracks current section: login, forgotPassword, register

    const renderSection = () => {
        switch (section) {
            case "login":
                return <LoginSection onChangeSection={setSection} />;
            case "forgotPassword":
                return <ForgotPasswordSection onChangeSection={setSection} />;
            case "register":
                return <RegisterSection onChangeSection={setSection} />;
            default:
                return <LoginSection onChangeSection={setSection} />;
        }
    };

    return (
        <div className="container">
            <Welcome />
            {renderSection()}
        </div>
    );
}
