import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

export function ResetPage() {
    const location = useLocation();
    const navigate = useNavigate(); 

    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [navigate, token]); 

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch("/user/reset_password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`, 
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || "An error occurred during password reset.");
            }

            return await response.json(); 
        },
        onSuccess: (data) => {
            setMessage(data.message || "Password reset successful.");
        },
        onError: (error) => {
            setMessage(error.message || "An error occurred during password reset.");
        },
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = { password };

        mutation.mutate(data);
    };

    if (message === "") {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Reset Password</h1>
                    <form id="loginForm" onSubmit={handleSubmit}>
                        <input
                            type="password"
                            className="input-field"
                            id="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="8"
                        />
                        <button type="submit" className="reset-button" disabled={mutation.isLoading}>
                            {mutation.isLoading ? "Resetting..." : "Reset"}
                        </button>
                    </form>
                    <Link to="/login">Go back</Link>
                </div>
            </div>
        );
    } else {
        return (
            <div className="login-section">
                <div className="login-container">
                    <h1>Reset Password</h1>
                    <p className="registration-text">{message}</p>
                    <Link to="/login">Go back</Link>
                </div>
            </div>
        );
    }
}
