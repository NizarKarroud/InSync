import React, { useState, useEffect , useRef } from "react";
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import {MoreVert, AttachFile, Send  } from "@mui/icons-material";
import { GroupInfoDialog } from "./groupdial";
import {useQueryClient  } from '@tanstack/react-query';

const fetchMessages = async (room_id, token, offset = 0) => {
    const url = `/room/messages/${room_id}?offset=${offset}`;
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
    console.log(data.messages)
    return data.messages;
};

export function Chats({ selectedChat, user, token, socket ,setchat }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const isGroupChat = 'room_name' in selectedChat;
    const queryClient = useQueryClient();

    const [offset, setOffset] = useState(1); 
    const [hasMore, setHasMore] = useState(true);
    const [openGroupDialog, setOpenGroupDialog] = useState(false);  
    const [openUserDialog, setOpenUserDialog] = useState(false);

    const handleLoadMoreMessages = async () => {
        setOffset(offset+1)
        const newMessages = await fetchMessages(selectedChat.room_id , token , offset);
        newMessages.reverse()
        if (newMessages.length === 0) {
            setHasMore(false); 
        } else {
            setMessages(prevMessages => [...newMessages, ...prevMessages]);
        }
        console.log(messages);
    };
    useEffect(() => {
        const fetchChatMessages = async () => {
            try {
                const chatId = selectedChat.room_id;
                const messages = await fetchMessages(chatId, token);
                setMessages(messages.reverse());
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        if (socket) {
            if (isGroupChat) {
                socket.emit("joinRoom", {
                    room_id: selectedChat.room_id,
                    user_id: user.user_id,
                });
                fetchChatMessages();

            } else {
                socket.emit("joinDirectRoom", {
                    room: selectedChat,
                });
            }

            socket.on("directRoomJoined", (data) => {
                fetchChatMessages();
            });

            socket.on("receiveMessage", (message) => {
                if (message.user_id === user.user_id) {
                    return;
                }
                setMessages((prevMessages) => [...prevMessages, message]);
            });
        }

        return () => {
            if (socket) {
                socket.emit("leaveRoom", selectedChat.room_id); 
                socket.off("receiveMessage"); 
                setMessages([]);
                setOffset(1);
                setHasMore(true);

            }
        };
    }, [selectedChat, token, socket, user.user_id, isGroupChat]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
    
        const message = {
            room_id: selectedChat.room_id,
            user_id: user.user_id,
            message: newMessage,
            message_type : "text" ,
            timestamp: new Date(),
        };
    
        // Emit the message to the server
        socket.emit("sendMessage", message);
    
        setMessages((prevMessages) => [...prevMessages, message]);
    
        setNewMessage("");
    };
    
    const handleGroupDialogOpen = () => {
        setOpenGroupDialog(true); 
    };

    const handleUserDialogOpen = () => {
        setOpenUserDialog(true); 
    };

    const handleClose = () => {
        setOpenGroupDialog(false);
        setOpenUserDialog(false); 
    };

    const leaveGroup = async (token, roomId) => {
        try {
          const response = await fetch(`/room/leave`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ room_id: roomId }),
          });
      
          if (!response.ok) {
            throw new Error("Failed to leave the group");
          }
      
          const data = await response.json();
          console.log("Successfully left the group", data);            
          queryClient.invalidateQueries(['groups', token]);
          setchat(null);

          
          return data;
        } catch (error) {
          console.error("Error leaving group:", error.message);
          throw error;
        }
      };
    
      const handleLeaveGroup = async () => {
        try {
          const roomId = selectedChat.room_id; 
      
          const result = await leaveGroup(token, roomId);
          console.log(result); 
          handleClose();
        } catch (error) {
          console.error("Error leaving group:", error);
        }
      };


      const handleFileUpload = async (event) => {
        const file = event.target.files[0];
    
        if (file) {
            const maxSize = 100 * 1024 * 1024; 
            if (file.size > maxSize) {
                alert("File size exceeds 100 MB. Please choose a smaller file.");
                return;
            }
    
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('size', file.size);
            
            const roomId = selectedChat.room_id; 
    
            try {
                const response = await fetch(`/room/upload/${roomId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });
    
                if (!response.ok) {
                    const data = await response.json();
                    alert(`Error: ${data.error}`);
                } else {
                    const data = await response.json();
                    console.log(data)
                    alert(`File uploaded successfully`);
    
                    const file_message = {
                        room_id: selectedChat.room_id,
                        user_id: user.user_id,
                        message: "",
                        message_type :"file",
                        timestamp: new Date(),
                        attachments: { 
                            link: data.link, 
                            name: data.name, 
                            size: data.size 
                        }
                    };
                    console.log(file_message)
                    socket.emit("sendMessage", file_message); 
                    setMessages((prevMessages) => [...prevMessages, file_message]);

                }
            } catch (error) {
                console.error('File upload failed:', error);
                alert('File upload failed');
            }
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
                    src={
                        isGroupChat
                            ? selectedChat.room_picture
                                ? `http://192.168.100.9:16000/rooms/${selectedChat.room_picture}`
                                : ""
                                : selectedChat.users?.[0]?.profile_picture
                            ? `http://192.168.100.9:16000/users/${selectedChat.users[0].profile_picture}`
                            : ""
                    }
                >

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
                    <IconButton sx={{ color: "#5E3F75" }}  onClick={isGroupChat ? handleGroupDialogOpen : handleUserDialogOpen} >
                        <MoreVert />
                    </IconButton>
                </Stack>
            </Box>

            {/* Message Section */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "scroll",  
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    backgroundColor: "#2D2F33",
                    position: "relative",  // Ensure this is set for the message box container


                }}
            >
            {/* */}
            {hasMore && (
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        fontSize: '12px', 
                        color: '#B0B0B0', 
                        padding: '4px',
                        "&:hover": {
                            color: '#A0A0A0', 
                        },
                    }}
                    onClick={handleLoadMoreMessages}
                >
                    Load More...
                </IconButton>
            )}

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
                                marginTop: 4,
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
                                src={
                                    selectedChat?.users?.[0]?.profile_picture
                                        ? `http://192.168.100.9:16000/users/${selectedChat.users[0].profile_picture}`
                                        : ""
                                }
                            />
                        )}
                        <Box
                            sx={{
                                padding: "12px",
                                borderRadius: "16px",
                                backgroundColor:
                                    message.user_id === user.user_id ? "#3A455A" : "#1E2A37",
                                color: "white",
                                maxWidth: "70%",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                wordWrap: "break-word",
                            }}
                        >
                            {message.message_type === "text" ? (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: "14px",
                                        whiteSpace: "pre-wrap",
                                        color: "rgba(255, 255, 255, 0.9)",
                                    }}
                                >
                                    {message.message || ""}
                                </Typography>
                            ) : (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        backgroundColor: "#2D2F33",
                                        padding: "8px",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            color: "#B0B0B0",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => window.open(message.attachments?.link, "_blank")}
                                    >
                                        [🗎 {message.attachments?.name || "Unknown File"}]
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: "12px",
                                            color: "#B0B0B0",
                                        }}
                                    >
                                        {message.attachments?.size || "Unknown Size"}
                                    </Typography>
                                </Box>
                            )}

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
                                {message.username ||
                                    selectedChat.users?.find(
                                        (user) => user.user_id == message.user_id
                                    )?.username}
                                {"   "}
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
            <IconButton 
                sx={{ color: "#5E3F75" }}
                onClick={() => document.getElementById("fileInput").click()}
            >
                <AttachFile />
                <input
                    id="fileInput"
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                />
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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();  
                            handleSendMessage(); 
                        }}}
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


            {/* Dialog for Group Chat */}

            <GroupInfoDialog open={openGroupDialog} onClose={handleClose} group={selectedChat } users={selectedChat.users} onLeaveGroup={handleLeaveGroup}  />

            {/* Dialog for Dm user */}

            <Dialog
                open={openUserDialog}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        backgroundColor: "#2D2F32",
                        color: "white",
                        borderRadius: "12px",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        borderBottom: "1px solid #333841",
                        fontWeight: "bold",
                        marginBottom: 2,
                    }}
                >
                    {selectedChat.users[0].first_name} {selectedChat.users[0].last_name}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: "center", paddingBottom: 2 }}>
                        <Avatar
                            sx={{
                                backgroundColor: user.profile_picture ? "transparent" : "#5E3F75",
                                width: 80,
                                height: 80,
                                marginBottom: 2,
                            }}
                            src={
                                selectedChat.users[0].profile_picture
                                    ? `http://192.168.100.9:16000/users/${selectedChat.users[0].profile_picture}`
                                    : ""
                            }
                            alt={selectedChat.users[0].username}
                        />
                        <Typography variant="h6" sx={{ color: "#E5E7EB" }}>
                            {selectedChat.users[0].username}
                        </Typography>
                        <Typography variant="body2" sx={{ marginTop: 2, color: "#9CA3AF" }}>
                            <strong>Email:</strong> {selectedChat.users[0].email}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                            <strong>Role:</strong> {selectedChat.users[0].role}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                            <strong>Account Created At:</strong>{" "}
                            {new Date(selectedChat.users[0].created_at).toLocaleDateString()}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: "1px solid #333841" }}>
                    <Button
                        onClick={handleClose}
                        sx={{ color: "#9CA3AF", "&:hover": { color: "#5E3F75" } }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
