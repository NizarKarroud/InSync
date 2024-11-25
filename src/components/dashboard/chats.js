import React, { useState, useEffect } from "react";
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Stack,
} from "@mui/material";
import {
    Call,
    Videocam,
    MoreVert,
    AttachFile,
    Send,
} from "@mui/icons-material";

const fetchMessages = async (chatId, token, isGroup) => {
    const url = isGroup ? `/chats/${chatId}/messages` : `/dms/${chatId}/messages`;
    const response = await fetch(url, {
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

export function Chats({ selectedChat, user, token, socket }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const isGroupChat = !!selectedChat.room_id;

    useEffect(() => {
        const fetchChatMessages = async () => {
            try {
                const chatId = isGroupChat
                    ? selectedChat.room_id
                    : selectedChat.user_id;
                const messages = await fetchMessages(chatId, token, isGroupChat);
                setMessages(messages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        if (selectedChat) {
            fetchChatMessages();
        }

        if (socket) {
            socket.emit("joinRoom", {
                room_id: selectedChat.room_id,
                user_id: user.user_id,
            });
        }

        return () => {
            if (socket) {
                const roomId = selectedChat.room_id;

                
                socket.emit("leaveRoom", roomId);
            }
        };
    }, [selectedChat, token, socket]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const url = isGroupChat
            ? `/chats/${selectedChat.room_id}/messages`
            : `/dms/${selectedChat.user_id}/messages`;

        const response = await fetch(url, {
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
                backgroundColor: "#2D2F33",
                color: "white",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {/* Top Header */}
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
                    <Avatar sx={{ bgcolor: "#5E3F75" }}>
                        {isGroupChat
                            ? selectedChat.room_name[0]
                            : selectedChat.username[0]}
                    </Avatar>
                    <Box>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", color: "white" }}
                        >
                            {isGroupChat
                                ? selectedChat.room_name
                                : selectedChat.username}
                        </Typography>
                        {isGroupChat ? (
                            <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                                {selectedChat.users.length} members
                            </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                                Chat with {selectedChat.first_name} {selectedChat.last_name}
                            </Typography>
                        )}
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
                                    {isGroupChat
                                        ? message.sender_name[0]
                                        : selectedChat.username[0]}
                                </Avatar>
                            )}
                            <Box
                                sx={{
                                    padding: "12px",
                                    borderRadius: "16px",
                                    backgroundColor:
                                        message.sender_id === user.id
                                            ? "#3A455A"
                                            : "#1E2A37",
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
                    height: 73,
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
                    maxRows={1}
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
