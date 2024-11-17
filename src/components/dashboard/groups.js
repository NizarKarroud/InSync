import React, { useState, useEffect } from "react";
import { Box, Avatar } from "@mui/material";

export function GroupsBox({ token }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch("/user/groups", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setGroups(data.group_rooms);
                } else {
                    console.error(`Failed to fetch groups, status: ${response.status}`);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchGroups();
        }
    }, [token]);

    const handleGroupClick = (groupId) => {
        setSelectedGroup(groupId);
        console.log(`Selected group ID: ${groupId}`);
        // Additional logic can be added here, such as navigating or fetching group details
    };

    if (loading) {
        return null; // Optionally show a loader
    }

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
            {groups.map((group) => (
                <Avatar
                    key={group.room_id}
                    onClick={() => handleGroupClick(group.room_id)}
                    title={group.room_name}
                    sx={{
                        bgcolor: selectedGroup === group.room_id ? "#764ae2" : "#4A90E2", // Highlight selected group
                        marginBottom: 2,
                        width: 40,
                        height: 40,
                        fontSize: 14,
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: selectedGroup === group.room_id ? "2px solid #FFFFFF" : "none",
                        transition: "all 0.3s ease",
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
