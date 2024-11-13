import React from "react";
import ReactDOM from 'react-dom/client';
import { Box, Container } from "@mui/material";
import { Outlet, useParams } from "react-router-dom";
import '../../styles/dashboard.css'
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';


export function GroupsBox() {
    return (

            <Box
                sx={{
                    backgroundColor: "#282F41",
                    height: "100vh",
                    width: 80,
                    boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
                }}
            >

            </Box>
    );
}


           /* <Stack direction="column" spacing={2}>
                <Box></Box>
                {loading ? (
                    <Box sx={{ color: "white" }}>Loading...</Box>
                ) : (
                    users.map((user) => (
                        <Avatar key={user.id} alt={user.name} src={user.avatar} />
                    ))
                )}
            </Stack> */