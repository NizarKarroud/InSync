import React, { useState } from "react";
import {  Link  } from 'react-router-dom';

export function ForgotPasswordSection() {
    const [reset_response , setResetResponse] = useState("")
    const [email , setEmail] = useState("")

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = { email };

        try {
            const response = await fetch("/user/forgotpwd", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify(data), 
            });

            if (response.ok) {
                const server_response = await response.json();
                setResetResponse(server_response.message);
            }

        } catch (error) {
            console.error("Network error:", error);
            setResetResponse("Network error, please try again later.");
        }
    };  

    if (reset_response == ""){
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Forgot Password</h1>
                    <p className="welcome-text" >Enter your email to reset your password.</p>
                    <form onSubmit={handleSubmit}>
                        <input type="email" className="input-field" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} />
                        <button type="submit" className="login-button">Reset Password</button>
                    </form>
                    <Link onClick={() => setResetResponse("")}  to="/login">Back to Login</Link>

                </div>
            </div>
        );
    }

    else {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Forgot Password</h1>
                    <p className="welcome-text"> {reset_response}</p>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        );
    }

}
