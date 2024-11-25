import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { Groups } from "./groups";
import { Dms } from "./dms";
import { Chats } from "./chats";
import { io } from "socket.io-client";

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
    const [socket, setSocket] = useState(null); 

    const { data: user, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["user", token],
        queryFn: () => fetchUser(token),
        enabled: !!token
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    useEffect(() => {
        if (token) {
            const newSocket = io("https://localhost:16000", {
                transports: ["websocket"],
                query: {
                    token: token, 
                },
            });

            newSocket.on("connect", () => {
                console.log("Connected to WebSocket server");
            });

            newSocket.on("disconnect", () => {
                localStorage.removeItem('token');
                navigate("/login");
                console.log("Disconnected from WebSocket server");
            });

            newSocket.on('connect_error', (err) => {
                console.error('Connection Error: ', err);
            });
            
            newSocket.on("message", (message) => {
                console.log("Message from server:", message);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token , navigate]);

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
        if (socket) {
            socket.emit("joinRoom", { chatId: chat.room_id }); 
        }
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
                <Chats selectedChat={selectedChat} user={user.user} token={token} socket={socket} />
            )}
        </Box>
    );
}
