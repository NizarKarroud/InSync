import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import '../../styles/dashboard.css';
import { GroupsBox } from "./groups";
import { Chats } from "./chats";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState();
    const [dms, setDm] = useState();

    const navigate = useNavigate();

    
    useEffect(() => {
        const retrievedToken = localStorage.getItem("token");
        setToken(retrievedToken);
        setLoading(false);
    }, []);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch("/user/groups", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setGroups(data);  
                } else {
                    console.error(`Failed to fetch groups, status: ${response.status}`);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        if (token) {
            fetchGroups();
        } else {
            console.error("No token found");
        }
    }, [token]);

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
            <GroupsBox  groups={groups} />
            <Chats />
        </Box>
    );
}
