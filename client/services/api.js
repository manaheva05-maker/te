import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'shinken_token';
export const API_URL_KEY = 'shinken_api_url';

const DEFAULT_URL = __DEV__
    ? 'http://localhost:3000'
    : 'https://your-app.onrender.com';

let _baseURL = DEFAULT_URL;

export const initApiUrl = async () => {
    try {
        const stored = await AsyncStorage.getItem(API_URL_KEY);
        if (stored) {
            _baseURL = stored;
            api.defaults.baseURL = `${stored}/api`;
            socketService.setURL(stored);
            return stored;
        }
    } catch {}
    return _baseURL;
};

export const setApiUrl = async (url) => {
    _baseURL = url;
    api.defaults.baseURL = `${url}/api`;
    await AsyncStorage.setItem(API_URL_KEY, url);
};

const api = axios.create({
    baseURL: `${_baseURL}/api`,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failedQueue = [];
};

api.interceptors.response.use(
    (res) => res.data,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }
            original._retry = true;
            isRefreshing = true;
            try {
                const data = await authAPI.refresh();
                await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
                processQueue(null, data.accessToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                await AsyncStorage.removeItem(TOKEN_KEY);
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);

export const authAPI = {
    login: (d) => api.post('/auth/login', d),
    register: (d) => api.post('/auth/register', d),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/auth/verify/${token}`),
};

export const userAPI = {
    getProfile: (id) => api.get(`/users/${id}`),
    updateProfile: (d) => api.put('/users/me', d),
    getMe: () => api.get('/users/me'),
    search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
    follow: (id) => api.post(`/users/${id}/follow`),
    unfollow: (id) => api.delete(`/users/${id}/follow`),
    getFollowers: (id) => api.get(`/users/${id}/followers`),
    getFollowing: (id) => api.get(`/users/${id}/following`),
    leaderboard: (p) => api.get(`/users/leaderboard?page=${p || 1}`),
};

export const duelAPI = {
    create: (d) => api.post('/duels', d),
    join: (id) => api.post(`/duels/${id}/join`),
    getActive: () => api.get('/duels/active'),
    getResult: (id) => api.get(`/duels/${id}/result`),
    history: (page) => api.get(`/duels/history?page=${page || 1}`),
};

export const clanAPI = {
    list: () => api.get('/clans'),
    create: (d) => api.post('/clans', d),
    get: (id) => api.get(`/clans/${id}`),
    join: (id) => api.post(`/clans/${id}/join`),
    leave: (id) => api.post(`/clans/${id}/leave`),
    kick: (clanId, userId) => api.post(`/clans/${clanId}/kick/${userId}`),
    updateInfo: (id, d) => api.put(`/clans/${id}`, d),
    getRequests: (id) => api.get(`/clans/${id}/requests`),
    acceptRequest: (clanId, userId) => api.post(`/clans/${clanId}/requests/${userId}/accept`),
    rejectRequest: (clanId, userId) => api.post(`/clans/${clanId}/requests/${userId}/reject`),
    startWar: (id, d) => api.post(`/clans/${id}/war/start`, d),
};

export const tournamentAPI = {
    list: () => api.get('/tournaments'),
    get: (id) => api.get(`/tournaments/${id}`),
    register: (id) => api.post(`/tournaments/${id}/register`),
    getBracket: (id) => api.get(`/tournaments/${id}/bracket`),
    getResult: (id) => api.get(`/tournaments/${id}/result`),
};

export const liveAPI = {
    list: () => api.get('/live'),
    get: (id) => api.get(`/live/${id}`),
    create: (d) => api.post('/live', d),
    end: (id) => api.post(`/live/${id}/end`),
    sendGift: (id, d) => api.post(`/live/${id}/gift`, d),
};

export const questionAPI = {
    getRandom: (cat, diff) => api.get(`/questions/random?category=${cat || ''}&difficulty=${diff || ''}`),
    report: (id, reason) => api.post(`/questions/${id}/report`, { reason }),
};

export const competitionAPI = {
    list: () => api.get('/competitions'),
    get: (id) => api.get(`/competitions/${id}`),
    register: (id) => api.post(`/competitions/${id}/register`),
    leaderboard: (id) => api.get(`/competitions/${id}/leaderboard`),
};

export const quizAPI = {
    start: (d) => api.post('/quiz/start', d),
    answer: (sessionId, d) => api.post(`/quiz/${sessionId}/answer`, d),
    finish: (sessionId) => api.post(`/quiz/${sessionId}/finish`),
};

export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: (p) => api.get(`/admin/users?page=${p || 1}`),
    banUser: (id) => api.post(`/admin/users/${id}/ban`),
    unbanUser: (id) => api.post(`/admin/users/${id}/unban`),
    getQuestions: (p) => api.get(`/admin/questions?page=${p || 1}`),
    createQuestion: (d) => api.post('/admin/questions', d),
    deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
    getTournaments: () => api.get('/admin/tournaments'),
    createTournament: (d) => api.post('/admin/tournaments', d),
    startTournament: (id) => api.post(`/admin/tournaments/${id}/start`),
    getLive: () => api.get('/admin/live'),
};

export default api;
