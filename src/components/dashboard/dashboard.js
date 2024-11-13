import React from "react";
import ReactDOM from 'react-dom/client';
import { Box, Container } from "@mui/material";
import { Outlet, useParams } from "react-router-dom";
import '../../styles/dashboard.css'
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { GroupsBox } from "./groups";
import { Chats } from "./chats";

export function Dashboard() {
    // const [users, setUsers] = useState([]);
    // const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     const fetchUsers = async () => {
    //         try {
    //             const response = await fetch("/user/groups");
    //             const data = await response.json();
    //             setUsers(data); 
    //         } catch (error) {
    //             console.error("Failed to fetch users:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchUsers();
    // }, []);

    return (
        <Box
            sx={{
                display: "flex",      
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
            }}>
               <GroupsBox/> 
               <Chats/> 

        </Box>

    );
}