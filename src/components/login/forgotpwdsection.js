import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

export function ForgotPasswordSection() {
    const [resetResponse, setResetResponse] = useState("");
    const [email, setEmail] = useState("");

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch("/user/forgotpwd", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "An error occurred while processing the request.");
            }

            return await response.json(); 
        },
        onSuccess: (data) => {
            setResetResponse(data.message || "Password reset instructions have been sent to your email.");
        },
        onError: (error) => {
            setResetResponse(error.message || "Network error, please try again later.");
        },
    });

    const handleSubmit = (event) => {
        event.preventDefault();

        const data = { email };

        mutation.mutate(data);
    };

    if (resetResponse === "") {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Forgot Password</h1>
                    <p className="welcome-text">Enter your email to reset your password.</p>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button type="submit" className="login-button" disabled={mutation.isLoading}>
                            {mutation.isLoading ? "Sending..." : "Reset Password"}
                        </button>
                    </form>
                    <Link onClick={() => setResetResponse("")} to="/login">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    } else {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Forgot Password</h1>
                    <p className="welcome-text">{resetResponse}</p>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        );
    }
}
