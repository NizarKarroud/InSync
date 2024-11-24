import React, { useState, useEffect } from "react";
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Stack,
    Divider,
} from "@mui/material";
import {
    Call,
    Videocam,
    MoreVert,
    InsertEmoticon,
    AttachFile,
    Send,
} from "@mui/icons-material";

const fetchMessages = async (chatId, token) => {
    const response = await fetch(`/chats/${chatId}/messages`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch messages, status: ${response.status}`);
    }

    const data = await response.json();
    return data.messages;
};

export function Chats({ selectedChat, user, token }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        const fetchChatMessages = async () => {
            try {
                const messages = await fetchMessages(selectedChat.room_id, token);
                setMessages(messages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchChatMessages();
    }, [selectedChat, token]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const response = await fetch(`/chats/${selectedChat.room_id}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: newMessage }),
        });

        if (response.ok) {
            const sentMessage = await response.json();
            setMessages((prev) => [...prev, sentMessage]);
            setNewMessage("");
        } else {
            console.error("Failed to send message");
        }
    };

    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#2D2F33", // Primary background
                color: "white",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {/* Compact Top Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 16px",
                    backgroundColor: "#333841",
                    borderBottom: "1px solid #444", 
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: "#5E3F75" }}>{selectedChat.room_name[0]}</Avatar>
                    <Box>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", color: "white" }}
                        >
                            {selectedChat.room_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                            Last active 10 mins ago
                        </Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                    <IconButton sx={{ color: "#5E3F75" }}>
                        <Call />
                    </IconButton>
                    <IconButton sx={{ color: "#5E3F75" }}>
                        <Videocam />
                    </IconButton>
                    <IconButton sx={{ color: "#5E3F75" }}>
                        <MoreVert />
                    </IconButton>
                </Stack>
            </Box>

            {/* Message Section */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    backgroundColor: "#2D2F33",  
                }}
            >
                {messages.map((message, index) => (
                    <React.Fragment key={index}>
                        {/* Date Separator */}
                        {index === 0 || 
                        new Date(messages[index - 1]?.timestamp).toDateString() !==
                            new Date(message.timestamp).toDateString() ? (
                            <Box
                                sx={{
                                    textAlign: "center",
                                    color: "#B0B0B0",
                                    fontSize: "12px",
                                    marginBottom: "8px",
                                }}
                            >
                                {new Date(message.timestamp).toDateString()}
                            </Box>
                        ) : null}
                        {/* Message Bubble */}
                        <Stack
                            direction="row"
                            justifyContent={
                                message.sender_id === user.id ? "flex-end" : "flex-start"
                            }
                        >
                            {message.sender_id !== user.id && (
                                <Avatar
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        marginRight: 1,
                                        bgcolor: "#5E3F75",
                                    }}
                                >
                                    {selectedChat.room_name[0]}
                                </Avatar>
                            )}
                            <Box
                                sx={{
                                    padding: "12px",
                                    borderRadius: "16px",
                                    backgroundColor:
                                        message.sender_id === user.id ? "#3A455A" : "#1E2A37",
                                    color: "white",
                                    maxWidth: "70%",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    wordWrap: "break-word",
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: "14px",
                                        whiteSpace: "pre-wrap",
                                        color: "rgba(255, 255, 255, 0.9)",
                                    }}
                                >
                                    {message.content}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: "block",
                                        marginTop: "4px",
                                        textAlign: "right",
                                        fontSize: "10px",
                                        color: "#B0B0B0",
                                    }}
                                >
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Typography>
                            </Box>
                        </Stack>
                    </React.Fragment>
                ))}
            </Box>

            {/* Bottom Input Section */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    height : 73     ,
                    backgroundColor: "#333841",
                    borderTop: "1px solid #444",
                }}
            >

                <IconButton sx={{ color: "#5E3F75" }}>
                    <AttachFile />
                </IconButton>
                <TextField
                fullWidth
                variant="standard"
                size="small"
                multiline
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                InputProps={{
                    disableUnderline: true,
                }}
                sx={{
                    backgroundColor: "#4A3A60", 
                    borderRadius: "20px",
                    padding: "10px 14px", 
                    color: "white",
                    "& .MuiInputBase-input": {
                        color: "white", 
                    },
                }}
                />

                <IconButton onClick={handleSendMessage} sx={{ marginLeft: "8px", color: "#5E3F75" }}>
                    <Send />
                </IconButton>
            </Box>
        </Box>
    );
}
