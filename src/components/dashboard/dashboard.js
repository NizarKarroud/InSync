import {React , useEffect , useState} from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import '../../styles/dashboard.css'
import { GroupsBox } from "./groups";
import { Chats } from "./chats";

export function Dashboard() {
    const [token, setToken] = useState();

    useEffect(() => {
        setToken(localStorage.getItem("token"));
    }, []);

    console.log(token)
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