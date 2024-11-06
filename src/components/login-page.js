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

    const [status , setStatus ] = useState("")

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
            }
            else {
                const logged =await response.json()
                setStatus(logged.status);
                console.log(logged.status)
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

    else {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Login</h1>
                    <p className="login-text">{status}</p>
                    <a onClick={() => setStatus("")}>Go back</a>

                </div>
            </div>
        );
    }

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
                    <button onClick={() => onChangeSection("login")} className="login-button">
                        Back to Login
                    </button>
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
                    <a onClick={() => setStatus("")}>Go back</a>
                </div>
            </div>
        );
    }
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
