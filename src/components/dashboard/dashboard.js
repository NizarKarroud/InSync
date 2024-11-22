import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import "../../styles/dashboard.css";
import { Groups } from "./groups";
import { Dms } from "./dms";

const fetchUser = async (token) => {
    const response = await fetch("/user/current", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user, status: ${response.status}`);
    }

    const data = await response.json();
    return data;
};

export function Dashboard() {
    const navigate = useNavigate();
    const [selectedChat, setSelectedChat] = useState(null);

    const token = localStorage.getItem("token");

    const { data: user, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["user", token],
        queryFn: () => fetchUser(token),
        enabled: !!token,
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    if (!token) {
        return null;
    }

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <p>Error: {error.message}</p>
                <button onClick={() => navigate("/login")}>Go to Login</button>
            </Box>
        );
    }

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
    };

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
            <Groups token={token} onSelectChat={handleSelectChat} />
            <Dms user={user.user} token={token} onSelectChat={handleSelectChat} refetchUser={refetch} />
            {/* Add Chats component here if needed */}
        </Box>
    );
}
