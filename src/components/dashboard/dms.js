import React, { useState } from "react";
import {
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { PeopleAlt, ListAlt, SettingsOutlined } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { UserProfileDialog } from "./settingdial";
import { UserListDialog } from "./userdial";

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

function DM({ dm, onSelectChat }) {
  const { username, profile_picture, first_name, last_name } = dm["users"][0];
  
  const initial = username.charAt(0).toUpperCase();

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
        "&:hover": { backgroundColor: "#5E3F75" },
      }}
      onClick={() => onSelectChat(dm)}
    >
      <Avatar
        sx={{ width: 30, height: 30, backgroundColor: "#5E3F75" }}
        src={profile_picture ? `http://192.168.100.9:16000/users/${profile_picture}` : ""}
      >
      </Avatar>
      <Box>
        <Typography style={{ color: "white", fontWeight: "bold" }}>
          {username} 
        </Typography>
        <Typography style={{ color: "grey", fontSize: "0.875rem" }}>
          Chat with {`${first_name} ${last_name}`}
        </Typography>
      </Box>
    </Stack>
  );
}

export function Dms({ user, token, onSelectChat, refetchUser }) {
  const { data: dms, isLoading, isError, error } = useQuery({
    queryKey: ["dms", token],
    queryFn: () => fetchDms(token),
    enabled: !!token,
  });

  const [openProfile, setOpenProfile] = useState(false);
  const [openUsersDialog, setOpenUsersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");  

  const handleSettingsClick = () => setOpenProfile(true);
  const handleCloseProfile = () => setOpenProfile(false);

  const handleOpenUsersDialog = () => setOpenUsersDialog(true);
  const handleCloseUsersDialog = () => setOpenUsersDialog(false);

  const handleSendMessage = (selectedUser) => {
    handleCloseUsersDialog();
    onSelectChat(selectedUser);
  };

  const filterDms = (dms, query) => {
    if (!query) return dms; 

    const queryLower = query.toLowerCase();
    return dms.filter((dm) => {
      const user = dm.users[0];
      const userString = `${user.username} ${user.first_name} ${user.last_name}`.toLowerCase();
      return userString.includes(queryLower); 
    });
  };

  const filteredDms = dms ? filterDms(dms, searchQuery) : [];

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Box
      sx={{
        height: "100vh",
        width: { xs: "100%", sm: 280 },
        backgroundColor: "#1E2326",
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Main Content */}
      <Stack sx={{ padding: 2, flex: 1, overflow: "hidden" }}>
        {/* Search Bar */}
        <TextField
          placeholder="Search"
          variant="outlined"
          size="small"
          sx={{
            marginBottom: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#333841",
              borderRadius: "20px",
              paddingX: 1,
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
            },
            "& .MuiOutlinedInput-input": {
              color: "white",
              paddingY: 0.5,
            },
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <Divider sx={{ borderBottomWidth: 2, borderColor: "#5E3F75" }} />

        {/* Users Section */}
        <Stack
          direction={"row"}
          alignContent={"center"}
          spacing={1.5}
          sx={{
            marginTop: 2,
            marginBottom: 2,
            cursor: "pointer",
            borderRadius: "10px",
            transition: "background-color 0.3s",
            "&:hover": { backgroundColor: "#5E3F75" },
          }}
          onClick={handleOpenUsersDialog}
        >
          <ListAlt style={{ color: "white" }} />
          <Typography style={{ color: "grey" }}>Users</Typography>
        </Stack>

        {/* Direct Messages */}
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
              backgroundColor: "#1E2326",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#5E3F75",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#4A3A60",
            },
          }}
        >
          {/* Mapping through Direct Messages */}
          {filteredDms.map((dm) => {
            return (
              <DM
                key={dm.room_id}
                dm={dm}
                onSelectChat={onSelectChat}
              />
            );
          })}
        </Stack>
      </Stack>

      {/* User Profile Section */}
      <Box
        sx={{
          padding: 2,
          backgroundColor: "#2D2F32",
          display: "flex",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Avatar
          sx={{
            backgroundColor: user.profile_picture ? "transparent" : "#5E3F75",
            width: 40,
            height: 40,
            marginRight: 2,
          }}
          src={user?.profile_picture ? `http://192.168.100.9:16000/users/${user.profile_picture}` : ""}
        >
        </Avatar>

        <Typography sx={{ color: "white", fontWeight: "bold", marginRight: 1 }}>
          {user.username}
        </Typography>
        <IconButton onClick={handleSettingsClick} sx={{ color: "white", ml: "auto" }}>
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
      {/* Users List Dialog */}
      <UserListDialog open={openUsersDialog} onClose={handleCloseUsersDialog} token={token} onSendMessage={handleSendMessage} currentUser={user} />
    </Box>
  );
}
