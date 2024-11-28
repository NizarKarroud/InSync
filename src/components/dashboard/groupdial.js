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
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";

import { CopyToClipboard } from "react-copy-to-clipboard";
import { FileCopy } from "@mui/icons-material"; 

export function GroupInfoDialog({ open, onClose, group, users , onLeaveGroup }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filterUsers = (users, query) => {
    if (!query) return users;
    const queryParts = query.trim().toLowerCase().split(/\s+/);

    return users.filter((user) => {
      const userString = `${user.username} ${user.first_name} ${user.last_name}`.toLowerCase();
      return queryParts.every((part) => userString.includes(part));
    });
  };

  const filteredUsers = filterUsers(users, searchQuery);

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
        Group {group.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ marginBottom: 2 }}>
            <Typography sx={{ color: "#E5E7EB", marginBottom: 2 }}>
            Group code
            {/* CopyToClipboard component for copying the group code */}
            <CopyToClipboard text={group.room_code}>
              <Button
                sx={{
                  color: "#5E3F75",
                  "&:hover": { color: "#7F4E92" },
                  marginLeft: 1,
                  padding: 0,
                }}
                variant="text"
                size="small"
                aria-label="copy group code"
              >
                <FileCopy fontSize="small" />
              </Button>
            </CopyToClipboard>
          </Typography>
          <Typography variant="h6" sx={{ color: "#E5E7EB", marginBottom : 2}}>
            Group Members
          </Typography>
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

        <List>
          {filteredUsers.map((user) => (
            <ListItem key={user.username} >
              <ListItemAvatar>
                <Avatar
                  src={`http://192.168.100.9:16000/users/${user.profile_picture}`}
                  alt={user.username}
                >
                  {!user.profile_picture && user.username[0].toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${user.first_name} ${user.last_name}`} secondary={user.username} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #333841" }}>
        <Button onClick={onClose} sx={{ color: "#9CA3AF", "&:hover": { color: "#5E3F75" } }}>
          Close
        </Button>
        <Button
          onClick={onLeaveGroup}
          sx={{ color: "#9CA3AF", "&:hover": { color: "#5E3F75" } }}
        >
          Leave Group
        </Button>
      </DialogActions>
    </Dialog>
  );
}
