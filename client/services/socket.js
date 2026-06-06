import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, API_URL_KEY } from './api';

const DEFAULT_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-app.onrender.com';

let socket = null;
let _url = DEFAULT_URL;

const socketService = {
    setURL(url) {
        _url = url;
    },

    async connect() {
        if (socket?.connected) return socket;

        try {
            const stored = await AsyncStorage.getItem(API_URL_KEY);
            if (stored) _url = stored;

            const token = await AsyncStorage.getItem(TOKEN_KEY);

            socket = io(_url, {
                auth: { token },
                transports: ['websocket'],
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socket.on('connect', () => console.log('Socket connected'));
            socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
            socket.on('connect_error', (err) => console.error('Socket error:', err.message));
        } catch (e) {
            console.error('Socket connect error:', e.message);
        }

        return socket;
    },

    disconnect() {
        socket?.disconnect();
        socket = null;
    },

    getSocket() {
        return socket;
    },

    emit(event, data) {
        socket?.emit(event, data);
    },

    on(event, cb) {
        socket?.on(event, cb);
    },

    off(event, cb) {
        socket?.off(event, cb);
    },
};

export default socketService;
