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
    });

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex' }}>
              <CircularProgress />
            </Box>
          );
    }

    // Handle errors
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
                backgroundColor: "#282F41",
                height: "100vh",
                width: 80,
                boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 2,
            }}
        >
            {/* Render groups */}
            {groups?.map((group) => (
                <Avatar
                    key={group.room_id}
                    onClick={() => handleGroupClick(group)} // When clicked, trigger selection and notify parent
                    title={group.room_name}
                    sx={{
                        bgcolor: group.room_id === selectedGroup ? "#764ae2" : "#4A90E2", // Highlight selected group
                        marginBottom: 2,
                        width: 40,
                        height: 40,
                        fontSize: 14,
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: group.room_id === selectedGroup ? "2px solid #FFFFFF" : "none",
                        transition: "all 0.3s ease",
                    }}
                >
                    {/* Display first letters of room name */}
                    {group.room_name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")}
                </Avatar>
            ))}
        </Box>
    );
}
