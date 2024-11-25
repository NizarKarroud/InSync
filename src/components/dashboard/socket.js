// socket.js
import { io } from "socket.io-client";

let socket = null;

export const getSocket = (token) => {
    if (!socket) {
        socket = io("ws://192.168.100.9:16000", {
            transports: ["websocket"],
            query: { token },
        });

        // Log for debugging
        console.log("WebSocket connection established");
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log("WebSocket connection closed");
    }
};
