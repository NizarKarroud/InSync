import React, { useState  , useEffect} from "react";
import { useLocation , Link , useNavigate } from 'react-router-dom';

export function ResetPage(){
    const location = useLocation();
    const navigate = useNavigate(); 

    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        // If token is not found, redirect the user to the home page 
        if (!token) {
            navigate("/login");  
        }
    }, []); // Empty dependency array bc the token value doesnt change in the lifecycle of the component

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
            <div className="login-section">
            <div className="login-container">
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
                <Link to="/login">Go back</Link>


                </div>
            </div>
        );
    }
    else {
        return (
            <div className="login-section">
            <div className="login-container">
                <h1>Reset Password</h1>
                <p className="registration-text"> {message} </p>
                <Link to="/login">Go back</Link>

                </div>
            </div>
        );
    }
};