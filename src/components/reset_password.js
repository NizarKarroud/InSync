import React, { useState } from "react";
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

export function ResetPage(){
    const location = useLocation();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = { password };
        try {
            const response = await fetch("/user/reset_password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`  
                },
                body: JSON.stringify(data),
            });

            if (response.ok){
                const dataresp = await response.json();
                setMessage(dataresp.message)
            }
            else if (response.status === 404) {
                const errorResponse = await response.json()
                setMessage(errorResponse.message)
            }
            else {
                const errorResponse = await response.json()
                setMessage(errorResponse.msg)
            }
        } 
        catch (error) {
            console.error("Network error:", error);

        }
    };

    if (message == ""){
        return (
            <div className="reset-div">
                <h1>Reset Password</h1>
                <form id="loginForm" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="input-field"
                        id="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                        minLength="8"
                    />
                    <button type="submit" className="reset-button">Reset</button>
        
                </form>
        
            </div>
            );
    }
    else {
        return (
            <div className="reset-div">
                <h1>Reset Password</h1>
                <p className="registration-text"> {message} </p>
                <Link to="/">Go back</Link>
                </div>
            );
    }
};