import api from './api';

export const getNotifications = async (unreadOnly = false) => {
  const url = unreadOnly ? '/notifications/?unread_only=true' : '/notifications/';
  const response = await api.get(url);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`, { is_read: true });
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const createNotification = async (data) => {
  const response = await api.post('/notifications/', data);
  return response.data;
};
