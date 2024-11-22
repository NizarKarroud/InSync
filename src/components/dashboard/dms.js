import React, { useState } from "react";
import {
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import { PeopleAlt, ListAlt, SettingsOutlined } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import CircularProgress from "@mui/material/CircularProgress";
import { UserProfileDialog } from "./settingdial";

const fetchDms = async (token) => {
  const response = await fetch("/user/dms", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch DMs, status: ${response.status}`);
  }

  const data = await response.json();
  return data.direct_rooms;
};

const fetchUsers = async (token) => {
  const response = await fetch("/user/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users, status: ${response.status}`);
  }

  const data = await response.json();
  return data; 
};

function DM({ senderName, message, avatarColor, initial }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        marginTop: 2,
        cursor: "pointer",
        borderRadius: "10px",
        padding: 1,
        transition: "background-color 0.3s",
        "&:hover": { backgroundColor: "#4B5677" },
      }}
    >
      <Avatar sx={{ width: 30, height: 30, backgroundColor: avatarColor }}>
        {initial}
      </Avatar>
      <Box>
        <Typography style={{ color: "white", fontWeight: "bold" }}>
          {senderName}
        </Typography>
        <Typography style={{ color: "grey", fontSize: "0.875rem" }}>
          {message}
        </Typography>
      </Box>
    </Stack>
  );
}

export function Dms({ user, token, onSelectChat , refetchUser  }) {


  const { data: dms, isLoading, isError, error } = useQuery({
    queryKey: ["dms", token],
    queryFn: () => fetchDms(token),
    enabled: !!token,
  });

  const [openProfile, setOpenProfile] = useState(false);

  const handleSettingsClick = () => {
    setOpenProfile(true);
  };

  const handleCloseProfile = () => {
    setOpenProfile(false);
  };


  const handleSectionClick = (section) => {
    console.log(`${section} section clicked!`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  console.log("user is : " , user)

  return (
    <Box
      sx={{
        height: "100vh",
        width: 280,
        backgroundColor: "#32384D",
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Main Content */}
      <Stack sx={{ padding: 2, flex: 1, overflow: "hidden" }}>
        <TextField
          placeholder="Search"
          color="grey"
          focused
          variant="outlined"
          size="small"
          sx={{
            marginBottom: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#282F41",
              borderRadius: "20px",
              paddingX: 1,
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255, 255, 255, 0.5)",
              },
            },
            "& .MuiOutlinedInput-input": {
              color: "white",
              paddingY: 0.5,
            },
          }}
        />
        <Divider sx={{ borderBottomWidth: 2 }} />

        <Stack
          direction={"row"}
          alignContent={"center"}
          spacing={1.5}
          sx={{
            marginTop: 2,
            marginBottom: 1,
            cursor: "pointer",
            borderRadius: "10px",
            transition: "background-color 0.3s",
            "&:hover": { backgroundColor: "#4B5677" },
          }}
          onClick={() => handleSectionClick("Users")}
        >
          <ListAlt style={{ color: "white" }} />
          <Typography style={{ color: "grey" }}>Users</Typography>
        </Stack>

        <Stack
          direction={"row"}
          alignContent={"center"}
          spacing={1.5}
          sx={{
            marginTop: 1,
            marginBottom: 4,
            cursor: "pointer",
            borderRadius: "10px",
            transition: "background-color 0.3s",
            "&:hover": { backgroundColor: "#4B5677" },
          }}
          onClick={() => handleSectionClick("Friends")}
        >
          <PeopleAlt style={{ color: "white" }} />
          <Typography style={{ color: "grey" }}>Friends</Typography>
        </Stack>

        <Typography style={{ color: "grey" }}>Direct Messages</Typography>

        <Stack
          style={{
            maxHeight: "600px",
            overflowY: "auto",
          }}
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#32384D",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#555",
            },
          }}
        >
          {dms?.map((dm, index) => (
            <DM
              key={index}
              senderName={dm.users[0].username}
              message={`Chat with ${dm.users[0].username}`}
              avatarColor="#4A90E2"
              initial={dm.users[0].username[0]}
            />
          ))}
        </Stack>
      </Stack>

      {/* User Profile Section */}
      <Box
        sx={{
          padding: 2,
          backgroundColor: "#282F41",
          display: "flex",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Avatar
          sx={{
            backgroundColor: user.profile_picture ? "transparent" : "#4A90E2",
            width: 40,
            height: 40,
            marginRight: 2,
          }}
          src={user?.profile_picture ? `https://localhost:16000/users/${user.profile_picture}` : ""}
          alt={`${user.first_name} ${user.last_name}`}
        >
          {!user.profile_picture && (user.username[0]).toUpperCase()}
        </Avatar>

        <Typography sx={{ color: "white", fontWeight: "bold", marginRight: 1 }}>
          {user.username}
        </Typography>
        <IconButton onClick={handleSettingsClick} sx={{ color: "white", ml: 'auto' }}>
          <SettingsOutlined />
        </IconButton>
      </Box>

      {/* User Profile Dialog */}
      <UserProfileDialog
        openProfile={openProfile}
        handleCloseProfile={handleCloseProfile}
        refetchUser={refetchUser}
        user={user}
        token={token}
      />
    </Box>
  );
}
