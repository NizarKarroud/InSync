import React from "react";
import { Outlet } from "react-router-dom";
import '../../styles/login.css'

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


export function LoginPage() {

    return (
        <div className="container">
            <Welcome />
            <Outlet/>
        </div>
    );
}
