import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { Groups } from "./groups";
import { Dms } from "./dms";
import { Chats } from "./chats";
import { getSocket, disconnectSocket } from "./socket.js";

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

    return await response.json();
};

export function Dashboard() {
    const navigate = useNavigate();
    const [selectedChat, setSelectedChat] = useState(null); 
    const token = localStorage.getItem("token");
    const [socket, setSocket] = useState(null); 

    const { data: user, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["user", token],
        queryFn: () => fetchUser(token),
        enabled: !!token
    });

    // Redirect to login if no token
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Initialize WebSocket connection
    useEffect(() => {
        if (token) {
            const newSocket = getSocket(token);
            setSocket(newSocket);

            // Attach event listeners
            newSocket.on("connect", () => {
                console.log("Connected to WebSocket server");
            });

            newSocket.on("disconnect", () => {
                console.log("Disconnected from WebSocket server");
            });

            newSocket.on("directRoomJoined", (data) => {
                console.log("Received directRoomJoined event: ", data);
                alert(`You have joined the room ${data.room_id}: ${data.message}`);
            });

            return () => {
                newSocket.off("connect");
                newSocket.off("disconnect");
                newSocket.off("directRoomJoined");
            };
        }
    }, [token]);

    // Cleanup WebSocket on component unmount
    useEffect(() => {
        return () => {
            disconnectSocket();
        };
    }, []);

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
                flexDirection: { xs: "column", sm: "row" }, 
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                width: "100%",
            }}
        >
            <Groups token={token} onSelectChat={handleSelectChat} />
            <Dms user={user.user} token={token} onSelectChat={handleSelectChat} refetchUser={refetch} />
            {selectedChat && (
                <Chats selectedChat={selectedChat} user={user.user} token={token} socket={socket} setchat={setSelectedChat} />
            )}
        </Box>
    );
}
