
export const getToday = () => new Date().toISOString().split('T')[0];

export const formatTime = (date) => new Date(date).toLocaleTimeString();
