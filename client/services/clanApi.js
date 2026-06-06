import api from './api';

export const clanAPI = {
  // Core
  create:          (data)          => api.post('/clans/create', data),
  list:            (params)        => api.get('/clans', { params }),
  get:             (id)            => api.get(`/clans/${id}`),
  leave:           ()              => api.post('/clans/leave'),
  settings:        (id, data)      => api.patch(`/clans/${id}/settings`, data),

  // Recruitment
  requestJoin:     (id, data)      => api.post(`/clans/${id}/request`, data),
  joinViaCode:     (code)          => api.post(`/clans/invite/${code}/join`),
  getRequests:     (id)            => api.get(`/clans/${id}/requests`),
  reviewRequest:   (id, reqId, data) => api.patch(`/clans/${id}/requests/${reqId}`, data),
  generateCode:    (id)            => api.post(`/clans/${id}/invite-code`),

  // Members
  promote:         (id, userId, newRole) => api.patch(`/clans/${id}/members/${userId}/role`, { newRole }),
  kick:            (id, userId)    => api.delete(`/clans/${id}/members/${userId}`),

  // Chat
  getMessages:     (id, params)    => api.get(`/clans/${id}/messages`, { params }),
  sendMessage:     (id, data)      => api.post(`/clans/${id}/messages`, data),
  pinMessage:      (id, msgId, pinned) => api.patch(`/clans/${id}/messages/${msgId}/pin`, { pinned }),
  reactMessage:    (id, msgId, emoji)  => api.post(`/clans/${id}/messages/${msgId}/react`, { emoji }),

  // Treasury
  contribute:      (amount)        => api.post('/clans/treasury/add', { amount }),
};

export default clanAPI;
