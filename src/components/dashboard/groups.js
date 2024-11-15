import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

    export function GroupsBox({groups}) {
        console.log("Fetched groups data:", groups);

    return (
        <Box
            sx={{
                backgroundColor: "#282F41",
                height: "100vh",
                width: 80,
                boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
            }}
        />
    );
}
