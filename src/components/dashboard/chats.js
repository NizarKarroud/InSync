import { useState , useEffect} from "react";
import { Box, Divider, Stack, TextField, Typography  , Avatar} from "@mui/material";
import { PeopleAlt, ListAlt } from '@mui/icons-material';
import React from 'react';

function Chat({ senderName, message, avatarColor, initial }) {
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
        <Typography style={{ color: 'white', fontWeight: 'bold' }}>{senderName}</Typography>
        <Typography style={{ color: 'grey', fontSize: '0.875rem' }}>
          {message}
        </Typography>
      </Box>
    </Stack>
  );
}


export function Chats({token}) {
  const [dms, setDms] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSectionClick = (section) => {
      console.log(`${section} section clicked!`);
    };

  useEffect(() => {
      const fetchDms = async () => {
          try {
              const response = await fetch("/user/dms", {
                  method: "GET",
                  headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`,
                  },
              });

              if (response.ok) {
                  const data = await response.json();
                  setDms(data.direct_rooms);
              } else {
                  console.error(`Failed to fetch DMs, status: ${response.status}`);
              }
          } catch (error) {
              console.error("Fetch error:", error);
          } finally {
              setLoading(false);
          }
      };

      if (token) {
          fetchDms();
      }
  }, [token]);

  if (loading) {
      return null;
  }
  return (
    <Box
      sx={{
        height: "100vh",
        width: 280,
        backgroundColor: "#32384D",
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Stack sx={{ padding: 2 }}>
        <TextField
          placeholder="Search"
          color="grey"
          focused
          variant="outlined"
          size="small"
          sx={{
            marginBottom: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#282F41',
              borderRadius: '20px',
              paddingX: 1,
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiOutlinedInput-input': {
              color: 'white',
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
          onClick={() => handleSectionClick('Users')}
        >
          <ListAlt style={{ color: 'white' }} />
          <Typography style={{ color: 'grey' }}>Users</Typography>
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
          onClick={() => handleSectionClick('Friends')}
        >
          <PeopleAlt style={{ color: 'white' }} />
          <Typography style={{ color: 'grey' }}>Friends</Typography>
        </Stack>
        <Typography style={{ color: 'grey' }}>Direct Messages</Typography>

        <Stack   style={{
          maxHeight: '600px',  
          overflowY: 'auto'    
          }}
          sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#32384D', 
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888', 
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#555', 
          },
          }}>

          {dms.map((dm, index) => (
                        <Chat
                            key={index}
                            senderName={dm.users[0].username}
                            message={`Chat with ${dm.users[0].username}`}
                            avatarColor="#4A90E2"
                            initial={dm.users[0].username[0]}
                        />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
