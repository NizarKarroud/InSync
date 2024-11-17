import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import '../../styles/dashboard.css';
import { GroupsBox } from "./groups";
import { Chats } from "./chats";
import { useNavigate } from "react-router-dom";


export function Dashboard() {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const retrievedToken = localStorage.getItem("token");
        setToken(retrievedToken);
        setLoading(false);
    }, []);

    if (loading) {
        return null;  
    }

    if (!token) {
        navigate("/login");
        return null;
    }

    return (
        <Box
            sx={{
                display: "flex",
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
            }}
        >
            <GroupsBox token={token} />
            <Chats token={token} />
        </Box>
    );
}
