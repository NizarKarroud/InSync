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

const updateUserProfile = async ( username, email , token) => {
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

export function UserProfileDialog({ openProfile, handleCloseProfile, user , token , refetchUser }) {
  const [modifiedUsername, setModifiedUsername] = useState(user.username);
  const [modifiedEmail, setModifiedEmail] = useState(user.email);

  const mutation = useMutation({
    mutationFn: (updatedUserData) => updateUserProfile(updatedUserData.username, updatedUserData.email , token),
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
          backgroundColor: "#4B5677",  
          color: "white",
          borderRadius: "12px", 
          height: "80vh",  
        }
      }}
    >
      <DialogTitle>User Profile</DialogTitle>
      <DialogContent>
        <Box sx={{ paddingBottom: 2 }}>
          <Avatar
            sx={{
              backgroundColor: user.profile_picture ? "transparent" : "#4A90E2",
              width: 80,
              height: 80,
              marginBottom: 2,
            }}
            src={user?.profile_picture ? `https://localhost:16000/users/${user.profile_picture}` : ""}
            alt={`${user.first_name} ${user.last_name}`}
          />
          <Typography variant="h6">{user.first_name} {user.last_name}</Typography>

          {/* Username field */}
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={modifiedUsername}
            onChange={(e) => setModifiedUsername(e.target.value)}
            sx={{ marginTop: 2 }}
          />

          {/* Email field */}
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            type="email"
            value={modifiedEmail}
            onChange={(e) => setModifiedEmail(e.target.value)}
            sx={{ marginTop: 2 }}
          />

          {/* Role */}
          <Typography variant="body2" sx={{ marginTop: 2 }}>
            <strong>Role:</strong> {user.role} {/* Displaying the user role */}
          </Typography>

          {/* Account Created At */}
          <Typography variant="body2">
            <strong>Account Created At:</strong> {formatDate(user.created_at)} {/* Formatted date */}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCloseProfile} color="primary">
          Close
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          disabled={mutation.isLoading} 
        >
          {mutation.isLoading ? 'Saving...' : 'Save Changes'} {/* Show loading text */}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
