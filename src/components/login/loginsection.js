import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import { useMutation } from '@tanstack/react-query';

export function LoginSection() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const navigate = useNavigate();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch("/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.status || "Login failed"); 
            }
    
            const token = response.headers.get("Authorization")?.replace("Bearer ", ""); 
            return { token }; 
        },
        onSuccess: ({ token }) => {
            if (token) {
                localStorage.setItem("token", token);

                navigate("/dashboard");
            }
        },
        onError: (error) => {
            setStatus(error.message); 
        },
    });
    

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const data = { username, password };
        
        mutation.mutate(data); 
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
                        <button type="submit" className="login-button" disabled={mutation.isLoading}>
                            {mutation.isLoading ? 'Logging in...' : 'Login'}
                        </button>
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
