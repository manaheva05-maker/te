import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL =
  Constants.expoConfig?.extra?.SOCKET_URL ||
  'https://shinken-backend-7efe62c71433.herokuapp.com';

let clanSocket = null;

export const getClanSocket = () => {
  if (!clanSocket) {
    clanSocket = io(`${SOCKET_URL}/clan`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    clanSocket.on('connect', () => console.log('✅ Clan socket connected'));
    clanSocket.on('disconnect', () => console.log('⚠️ Clan socket disconnected'));
    clanSocket.on('connect_error', (e) => console.error('Clan socket error:', e.message));
  }
  return clanSocket;
};

export const disconnectClanSocket = () => {
  clanSocket?.disconnect();
  clanSocket = null;
};
