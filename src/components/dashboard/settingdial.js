import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Avatar, Typography, TextField } from '@mui/material';
import { useMutation } from '@tanstack/react-query';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric',
    hour12: true 
  });
};

const updateUserProfile = async (username, email, token) => {
  const response = await fetch(`/user/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, email }),
  });

  if (response.status === 429) {
    throw new Error('Too many requests. Please try again later.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const responseData = await response.json();
    const newToken = response.headers.get("Authorization")?.replace("Bearer ", ""); 
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    if (!response.ok) {
      throw new Error(responseData.status || 'Error updating profile');
    }
    return responseData;
  } else {
    const text = await response.text();
    throw new Error(`Unexpected response: ${response.status} - ${text}`);
  }
};

export function UserProfileDialog({ openProfile, handleCloseProfile, user, token, refetchUser }) {
  const [modifiedUsername, setModifiedUsername] = useState(user.username);
  const [modifiedEmail, setModifiedEmail] = useState(user.email);

  const mutation = useMutation({
    mutationFn: (updatedUserData) => updateUserProfile(updatedUserData.username, updatedUserData.email, token),
    onSuccess: (data) => {
      console.log('Profile updated successfully:', data);
      refetchUser(); 
      handleCloseProfile(); 
    },
    onError: (error) => {
      alert(`Error updating profile: ${error.message}`);
    }
  });

  const handleSave = () => {
    mutation.mutate({ username: modifiedUsername, email: modifiedEmail });
  };

  return (
    <Dialog 
      open={openProfile} 
      onClose={handleCloseProfile} 
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: "#2D2F32", 
          color: "white", 
          borderRadius: "12px",
          height: "80vh", 
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid #333841", fontWeight: "bold" , marginBottom:2}}>
        User Profile
      </DialogTitle>
      <DialogContent>
        <Box sx={{ paddingBottom: 2, textAlign: "center" }}>
          <Avatar
            sx={{
              backgroundColor: user.profile_picture ? "transparent" : "#5E3F75", 
              width: 80,
              height: 80,
              marginBottom: 2,
            }}
            src={user?.profile_picture ? `http://192.168.100.9:16000/users/${user.profile_picture}` : ""}
            alt={`${user.first_name} ${user.last_name}`}
          />
          <Typography variant="h6" sx={{ color: "#E5E7EB" }}>
            {user.first_name} {user.last_name}
          </Typography>

          {/* Username field */}
          <TextField
            fullWidth
            label="Username"
            variant="filled"
            value={modifiedUsername}
            onChange={(e) => setModifiedUsername(e.target.value)}
            sx={{
              marginTop: 2,
              backgroundColor: "#333841", 
              input: { color: "#E5E7EB" },
              "& .MuiInputLabel-root": { color: "#9CA3AF" }, 
              "& .MuiFilledInput-root:hover": {
                backgroundColor: "#4B5563", 
              },
            }}
          />

          {/* Email field */}
          <TextField
            fullWidth
            label="Email"
            variant="filled"
            type="email"
            value={modifiedEmail}
            onChange={(e) => setModifiedEmail(e.target.value)}
            sx={{
              marginTop: 2,
              backgroundColor: "#333841",
              input: { color: "#E5E7EB" },
              "& .MuiInputLabel-root": { color: "#9CA3AF" },
              "& .MuiFilledInput-root:hover": {
                backgroundColor: "#4B5563",
              },
            }}
          />

          {/* Role */}
          <Typography variant="body2" sx={{ marginTop: 2, color: "#9CA3AF" }}>
            <strong>Role:</strong> {user.role}
          </Typography>

          {/* Account Created At */}
          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
            <strong>Account Created At:</strong> {formatDate(user.created_at)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #333841" }}>
        <Button 
          onClick={handleCloseProfile} 
          sx={{ color: "#9CA3AF", "&:hover": { color: "#5E3F75" } }} 
        >
          Close
        </Button>
        <Button 
          onClick={handleSave} 
          sx={{ 
            backgroundColor: "#5E3F75", 
            color: "white", 
            "&:hover": { backgroundColor: "#7F4E92" }
          }} 
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
