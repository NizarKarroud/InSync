import React from "react";
import ReactDOM from 'react-dom/client';
import { Box, Container } from "@mui/material";
import { Outlet, useParams } from "react-router-dom";
import '../../styles/dashboard.css'

export function Dashboard() {
    return (
        <Box
            sx={{
                backgroundColor: "black",
                height: "100vh",
                width: 100,
                position: "absolute",  
                left: 0,               
                top: 0                 
            }}
        />
    );
}
