import React, { useState } from "react";
import { Box, Avatar } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import CircularProgress from '@mui/material/CircularProgress';

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
                border: "2px solid #5E3F75"
            }}
        >
            {/* Render groups */}
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
                >
                    {group.room_name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")}
                </Avatar>
            ))}
        </Box>
    );
}
