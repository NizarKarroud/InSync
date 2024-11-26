import React, { useState, useEffect } from "react";
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Stack,
} from "@mui/material";
import { Call, Videocam, MoreVert, AttachFile, Send } from "@mui/icons-material";

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
    const isGroupChat = 'room_name' in selectedChat;

    useEffect(() => {
        // Function to fetch messages for the selected chat
        const fetchChatMessages = async () => {
            try {
                const chatId = selectedChat.room_id;
                const messages = await fetchMessages(chatId, token, isGroupChat);
                setMessages(messages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        // Join the room for the selected chat based on room_type
        if (socket) {
            if (isGroupChat) {
                socket.emit("joinRoom", {
                    room_id: selectedChat.room_id,
                    user_id: user.user_id,
                });
            } else {
                socket.emit("joinDirectRoom", {
                    room: selectedChat,
                });
            }

            socket.on("directRoomJoined", (data) => {
                console.log("Direct room joined:", data);
            });

            // Listen for incoming messages
            socket.on("receiveMessage", (message) => {
                console.log("Received message:", message); 
                if (message.user_id === user.user_id) {
                    return;
                }
                setMessages((prevMessages) => [...prevMessages, message]);
            });
        }

        return () => {
            if (socket) {
                if (isGroupChat) {
                    socket.emit("leaveRoom", selectedChat.room_id); // Leave the group room
                } else {
                    socket.emit("leaveDirectRoom", selectedChat.room_id); // Leave the direct message room
                }
                socket.off("receiveMessage");  // Remove event listener for receiveMessage
            }
        };
    }, [selectedChat, token, socket, user.user_id, isGroupChat]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
    
        const message = {
            room_id: selectedChat.room_id,
            user_id: user.user_id,
            message: newMessage,
            timestamp: new Date(),
        };
    
        // Emit the message to the server
        socket.emit("sendDM", message);
    
        setMessages((prevMessages) => [...prevMessages, message]);
    
        setNewMessage("");
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
            {/* Top Header with room information */}
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
                    <Avatar
                        sx={{ bgcolor: "#5E3F75" }}
                        src={isGroupChat
                            ? ""
                            : selectedChat.users[0].profile_picture
                            ? `http://192.168.100.9:16000/users/${selectedChat.users[0].profile_picture}` 
                            : ""
                        }
                    >
                        {isGroupChat
                            ? selectedChat.room_name[0] 
                            : ""  
                        }
                    </Avatar>
                    <Box>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", color: "white" }}
                        >
                            {isGroupChat
                                ? selectedChat.room_name
                                : selectedChat.users[0].username}
                        </Typography>
                        {isGroupChat ? (
                            <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                                {selectedChat.users.length} members
                            </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                                Chat with {selectedChat.users[0].first_name} {selectedChat.users[0].last_name}
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
                            justifyContent={message.user_id === user.user_id ? "flex-end" : "flex-start"}
                        >
                            {message.user_id !== user.user_id && (
                                <Avatar
                                    sx={{
                                        backgroundColor: user.profile_picture ? "transparent" : "#5E3F75",
                                        width: 40,
                                        height: 40,
                                        marginRight: 2,
                                    }}
                                    src={selectedChat.users[0].profile_picture ? `http://192.168.100.9:16000/users/${selectedChat.users[0].profile_picture}` : ""}
                                >

                                </Avatar>
                            )}
                            <Box
                                sx={{
                                    padding: "12px",
                                    borderRadius: "16px",
                                    backgroundColor:
                                        message.user_id === user.user_id
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
                                    {message.message || ""}  {/* Fallback if content is missing */}
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
                        padding: "10px 12px",
                        color: "white",
                    }}
                />
                <IconButton
                    sx={{
                        color: "#5E3F75",
                        marginLeft: "8px",
                    }}
                    onClick={handleSendMessage}
                >
                    <Send />
                </IconButton>
            </Box>
        </Box>
    );
}
