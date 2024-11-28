import React, { useState } from "react";
import { 
    Box, 
    Avatar, 
    IconButton, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    Button, 
    TextField 
} from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';

const fetchGroups = async (token) => {
    const response = await fetch("/user/groups", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch groups, status: ${response.status}`);
    }

    const data = await response.json();
    return data.group_rooms;
};

export function Groups({ token, onSelectChat }) {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogView, setDialogView] = useState("default");  
    const [groupName, setGroupName] = useState("");
    const [uploadedPicture, setUploadedPicture] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [groupCode, setGroupCode] = useState("");
    
    const { data: groups, isLoading, isError, error } = useQuery({
        queryKey: ['groups', token],
        queryFn: () => fetchGroups(token),
        enabled: !!token,
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return <div>Error: {error.message}</div>;
    }

    const handleGroupClick = (group) => {
        setSelectedGroup(group.room_id);
        onSelectChat(group);
    };

    const handleAddGroup = () => {
        setOpenDialog(true);
        setDialogView("default");  
    };

    const handleJoinGroup = () => {
        setDialogView("join");
    };

    const handleCreateGroup = () => {
        setDialogView("create");
    };

    const handleJoinSubmit = async () => {
        if (!groupCode) {
            alert("Please enter a group code");
            return;
        }
    
        try {
            const response = await fetch("/room/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ room_code: groupCode }), 
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert("Successfully joined the group");
                setOpenDialog(false); 
                setGroupCode("");
            } else {
                alert(`Error: ${result.error || "Failed to join group"}`);
            }
        } catch (error) {
            console.error("Error joining group:", error);
            alert("An error occurred while trying to join the group");
        }
    };

    const handleCreateSubmit = async () => {
        if (!groupName) {
            alert("Please enter a group name");
            return;
        }
    
        const formData = new FormData();
        formData.append("room_name", groupName);
        formData.append("room_type", "group");  
        if (uploadedPicture) {
            formData.append("picture", uploadedPicture);  
        }
    
        try {
            const response = await fetch("/room/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData, 
            });
    
            const result = await response.json();
            if (response.ok) {
                alert("Group created successfully");
                setOpenDialog(false);
                setGroupName("");
                setUploadedPicture(null);
            } else {
                alert(`Error: ${result.error || "Failed to create group"}`);
            }
        } catch (error) {
            console.error("Error creating group:", error);
            alert("An error occurred while creating the group");
        }
    };
    

    const handlePictureUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedPicture(file);
    
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result);  
            };
            reader.readAsDataURL(file);
        }
    };
    

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setGroupName(""); 
        setUploadedPicture(null); 
        setDialogView("default");
    };

    return (
        <Box
            sx={{
                backgroundColor: "#2D2F32",
                height: "100vh",
                width: { xs: "100%", sm: 80 },
                boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 2,
                border: "2px solid #5E3F75",
                position: 'relative',
            }}
        >
            {groups?.map((group) => (
                <Avatar
                    key={group.room_id}
                    onClick={() => handleGroupClick(group)}
                    title={group.room_name}
                    sx={{
                        bgcolor: group.room_id === selectedGroup ? "#5E3F75" : "#333841",
                        marginBottom: 2,
                        width: 40,
                        height: 40,
                        fontSize: 14,
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: group.room_id === selectedGroup ? "2px solid #FFFFFF" : "none",
                        transition: "all 0.3s ease",
                        color: "#FFFFFF",
                        "&:hover": {
                            bgcolor: "#5E3F75",
                        },
                    }}
                    src={group.room_picture ? `http://192.168.100.9:16000/rooms/${group.room_picture}` : ""}

                >
                </Avatar>
            ))}

            <IconButton
                onClick={handleAddGroup}
                sx={{
                    position: 'absolute',
                    bottom: 20,
                    bgcolor: "#5E3F75",
                    color: "#fff",
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                        bgcolor: "#7A4B9A",
                    },
                }}
            >
                <AddIcon />
            </IconButton>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                sx={{
                    "& .MuiDialog-paper": {
                        backgroundColor: "#2D2F32",
                        width: '40vw',
                        height: '80vh',
                        maxWidth: 'none',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                    }
                }}
            >
                {dialogView === "default" && (
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-around',
                            height: '100%',
                            padding: 0,
                        }}
                    >
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: '#333841',
                                color: '#fff',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                "&:hover": {
                                    backgroundColor: '#5E3F75',
                                },
                            }}
                            onClick={handleJoinGroup}
                        >
                            <h3>Join a Group</h3>
                        </Box>
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: '#333841',
                                color: '#fff',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '10px',
                                cursor: 'pointer',
                                "&:hover": {
                                    backgroundColor: '#5E3F75',
                                },
                            }}
                            onClick={handleCreateGroup}
                        >
                            <h3>Create a Group</h3>
                        </Box>
                    </DialogContent>
                )}
                {dialogView === "join" && (
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                        }}
                    >
                        <TextField
                            label="Group Code"
                            variant="outlined"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value)}
                            fullWidth
                            sx={{
                                marginBottom: 3,
                                backgroundColor: "#fff",
                                borderRadius: 1,
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleJoinSubmit}
                            sx={{
                                backgroundColor: "#5E3F75",
                                color: "#fff",
                                "&:hover": {
                                    backgroundColor: "#7A4B9A",
                                },
                            }}
                        >
                            Join
                        </Button>
                    </DialogContent>
                )}
                {dialogView === "create" && (
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                        }}
                    >
                        <TextField
                            label="Group Name"
                            variant="outlined"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            fullWidth
                            sx={{
                                marginBottom: 3,
                                backgroundColor: "#fff",
                                borderRadius: 1,
                            }}
                        />
                        <Button
                            variant="contained"
                            component="label"
                            sx={{
                                marginBottom: 3,
                                backgroundColor: "#5E3F75",
                                color: "#fff",
                                "&:hover": {
                                    backgroundColor: "#7A4B9A",
                                },
                            }}
                        >
                            Upload Picture
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handlePictureUpload}
                            />
                        </Button>
                        {uploadedPicture && (
                            <Box
                                component="img"
                                src={preview}
                                alt="Group Preview"
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    marginBottom: 3,
                                    objectFit: 'cover',
                                }}
                            />
                        )}
                        <Button
                            variant="contained"
                            onClick={handleCreateSubmit}
                            sx={{
                                backgroundColor: "#5E3F75",
                                color: "#fff",
                                "&:hover": {
                                    backgroundColor: "#7A4B9A",
                                },
                            }}
                        >
                            Create
                        </Button>
                    </DialogContent>
                )}
            </Dialog>
        </Box>
    );
}
