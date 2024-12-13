import React, {useEffect, useState  } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,Badge, Menu, MenuItem
} from "@mui/material";
import { PeopleAlt, ListAlt, SettingsOutlined, Logout  } from "@mui/icons-material";
import { useQuery  , useQueryClient} from "@tanstack/react-query";
import { UserProfileDialog } from "./settingdial";
import { UserListDialog } from "./userdial";

import NotificationsIcon from "@mui/icons-material/Notifications";

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

const fetchNotifications = async (token) => {
  const response = await fetch("/user/notifications", {
      method: "GET",
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
      },
  });

  if (!response.ok) {
      throw new Error(`Failed to fetch notifications, status: ${response.status}`);
  }

  const Data = await response.json();
  console.log(Data);
  return Data.notifications;
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

export function Dms({ user, token, onSelectChat, refetchUser , notifications ,setnotif , logout }) {
  const { data: dms, isLoading, isError, error } = useQuery({
    queryKey: ["dms", token],
    queryFn: () => fetchDms(token),
    enabled: !!token,
  });

  const [openProfile, setOpenProfile] = useState(false);
  const [openUsersDialog, setOpenUsersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");  

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSettingsClick = () => setOpenProfile(true);
  const handleCloseProfile = () => setOpenProfile(false);

  const handleOpenUsersDialog = () => setOpenUsersDialog(true);
  const handleCloseUsersDialog = () => setOpenUsersDialog(false);

  const [anchorEl, setAnchorEl] = useState(null);

  
  useEffect(() => {
    if (token) {
        fetchNotifications(token)
            .then((notifications) => setnotif(notifications))
            .catch((err) => console.error(err));
      }

  }, [token]);

  const handleSendMessage = async (selectedUser) => {

    try {
          const response = await fetch("/user/dms/initiate", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ recipient: selectedUser }),
          });

          if (!response.ok) {
              throw new Error(`Failed to initiate DM, status: ${response.status}`);
          }

          const roomData = await response.json();
          console.log(roomData)

          onSelectChat(roomData);

          queryClient.invalidateQueries(["dms"]);
      } 
      catch (error) {
          console.error("Error initiating DM:", error);
      }
    handleCloseUsersDialog();

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

  
  const handleNotificationClick =  (event) => {
    setAnchorEl(event.currentTarget);


  };

  const handleMenuClose = async () => {
    try {
      const response = await fetch("/user/notifications/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to clear notifications, status: ${response.status}`);
      }
  
      setnotif([]); 
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
    setAnchorEl(null);
  };

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
    const groupedNotifications = notifications.reduce((acc, notif) => {
      // If room_id is not in the accumulator, add it with an empty array
      if (!acc[notif.room_id]) {
          acc[notif.room_id] = [];
      }
      // Push the current notification to the appropriate room_id group
      acc[notif.room_id].push(notif);
      return acc;
  }, {});


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
        <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          marginBottom: 2,
        }}
      >
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
        
        <Box>
                <IconButton
                    size="large"
                    aria-label="show notifications"
                    color="inherit"
                    onClick={handleNotificationClick}
                >
                    <Badge badgeContent={notifications.length} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    {notifications.length === 0 ? (
                        <MenuItem>No Notifications</MenuItem>
                    ) : (
                      Object.keys(groupedNotifications).map((room_id) => (
                        <MenuItem key={room_id}>
                            You got {groupedNotifications[room_id].length} messages from {groupedNotifications[room_id][0].room_name}
                        </MenuItem>
                    ))
                    )}
                </Menu>
        </Box>
      </Stack>

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
          boxShadow: "0px -2px 4px rgba(0, 0, 0, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
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
        <Typography variant="body1" color="white">{user?.username}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={handleSettingsClick} size="large" color="inherit">
            <SettingsOutlined style={{ color: "white" }} />
          </IconButton>
          <IconButton onClick={logout} size="large" color="inherit">
            <Logout style={{ color: "white" }} />
          </IconButton>
        </Stack>
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
