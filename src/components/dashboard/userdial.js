import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";

export function ViewUserDialog({ open, onClose, user, onSendMessage }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: "#2D2F32",
          color: "white",
          borderRadius: "12px",
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid #333841", fontWeight: "bold", marginBottom: 2 }}>
        {user.first_name} {user.last_name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: "center", paddingBottom: 2 }}>
          <Avatar
            sx={{
              backgroundColor: user.profile_picture ? "transparent" : "#5E3F75",
              width: 80,
              height: 80,
              marginBottom: 2,
            }}
            src={user.profile_picture ? `https://localhost:16000/users/${user.profile_picture}` : ""}
            alt={user.username}
          />
          <Typography variant="h6" sx={{ color: "#E5E7EB" }}>
            {user.username}
          </Typography>
          <Typography variant="body2" sx={{ marginTop: 2, color: "#9CA3AF" }}>
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
            <strong>Role:</strong> {user.role}
          </Typography>
          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
            <strong>Account Created At:</strong> {new Date(user.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #333841" }}>
        <Button onClick={onClose} sx={{ color: "#9CA3AF", "&:hover": { color: "#5E3F75" } }}>
          Close
        </Button>
        <Button
          onClick={() => onSendMessage(user)}
          sx={{
            backgroundColor: "#5E3F75",
            color: "white",
            "&:hover": { backgroundColor: "#7F4E92" },
          }}
        >
          Send Message
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const fetchUsers = async (token) => {
  const response = await fetch("/user/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await response.json();
  return data;
};

export function UserListDialog({ open, onClose, token, onSendMessage, currentUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ["users", token],
    queryFn: () => fetchUsers(token),
    enabled: open,
  });

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setViewUserOpen(true);
  };

  const handleSendMessage = (user) => {
    onSendMessage(user);
    setViewUserOpen(false);
  };

  const filterUsers = (users, query) => {
    if (!query) return users; 
    const queryParts = query.trim().toLowerCase().split(/\s+/); 

    return users.filter((user) => {
      const userString = `${user.username} ${user.first_name} ${user.last_name}`.toLowerCase();
      return queryParts.every((part) => userString.includes(part));
    });
  };

  const filteredUsers = users ? filterUsers(users, searchQuery) : [];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: {
              xs: "90%",
              sm: "80%",
              md: "60%",
            },
            maxWidth: "md",
            height: {
              xs: "70vh",
              sm: "80vh",
              md: "85vh",
            },
            backgroundColor: "#323840",
            color: "white",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid #333841", fontWeight: "bold" }}>
          User List
        </DialogTitle>
        <DialogContent>
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by username, first name, or last name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                backgroundColor: "#42474E",
                input: { color: "white" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#555A61",
                  },
                  "&:hover fieldset": {
                    borderColor: "#5E3F75",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#7F4E92",
                  },
                },
              }}
              InputProps={{
                style: {
                  color: "white",
                },
              }}
            />
          </Box>
          {isLoading && <CircularProgress />}
          {isError && <div>Error: {error.message}</div>}
          {filteredUsers && (
            <List>
              {filteredUsers
                .filter((user) => user.username !== currentUser.username)
                .map((user) => (
                  <ListItem key={user.username} button onClick={() => handleUserClick(user)}>
                    <ListItemAvatar>
                      <Avatar
                        src={`https://localhost:16000/users/${user.profile_picture}`}
                        alt={user.username}
                      >
                        {!user.profile_picture && user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.first_name} ${user.last_name}`}
                      secondary={user.username}
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #333841" }}>
          <Button onClick={onClose} sx={{ color: "#9CA3AF", "&:hover": { color: "#5E3F75" } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {selectedUser && (
        <ViewUserDialog
          open={viewUserOpen}
          onClose={() => setViewUserOpen(false)}
          user={selectedUser}
          onSendMessage={handleSendMessage}
        />
      )}
    </>
  );
}
