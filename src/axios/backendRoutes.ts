export const BackendRoutes = {
  LOGIN: "/auth/login",
  AUTHENTICATE: "/auth/authenticate",
  GOOGLE_LOGIN: "/auth/google-login",
  DEV_LOGIN: "/auth/dev-login",
  REGISTER: "/auth/signup",
  REFRESH_TOKEN: "/auth/refresh",
  SIGNUP_ANALYSIS: "/signup/analysis",
  SIGNUP_COMPLETE: "/profile/signup-complete",
  SIGNUP_COMPLETE_AUTH: "/profile/signup-complete-auth",
  PAYWALL_REACHED: "/profile/paywall-reached",
  PAYWALL_STATUS: "/profile/paywall-status",
  // Devices
  DEVICES_REGISTER: "/devices/register",
  GOALS: "/auth/goals",
  LOGS: "/logs/",
  MOOD_STATS: "/logs/mood-stats",
  LAST_RELAPSE: "/profile/get-last-relapse",
  UPDATE_LAST_RELAPSE: "/profile/last-relapse",
  RELAPSE: "/profile/record-relapse",
  JOURNAL: "/journal/",
  PLEDGE: "/pledge/",
  PLEDGE_HISTORY: "/pledge/history",
  DAILY_QUOTE: "/quote",
  ACHIEVEMENTS: "/achievements/",

  // Community / Chat
  CHAT_ROOMS: "/chat/rooms",
  CHAT_ROOM_MESSAGES: (slug: string) => `/chat/rooms/${slug}/messages`,

  // Community Forum
  COMMUNITY_POSTS: "/community/posts",
  COMMUNITY_POST_UPVOTE: (postId: string | number) => `/community/posts/${postId}/upvote`,
  COMMUNITY_POST_COMMENTS: (postId: string | number) => `/community/posts/${postId}/comments`,

  // Users
  USER_BY_ID: (userId: string) => `/users/by-id/${userId}`,

  // Account management
  DELETE_ACCOUNT_CONFIRM: (token: string) =>
    `/user/delete-account-confirm/${token}`,

  // Streaks
  STREAKS: "/streak/streaks",

  // Oria chat routes
  ORIA_CHATS: "/oria/chats",
  ORIA_CHAT: (chatId: string) => `/oria/chats/${chatId}`,

  // Send a message to a chat (POST method)
  ORIA_MESSAGES: (chatId: string) => `/oria/chats/${chatId}/message`,

  // Get streaming responses for a chat (GET method with SSE)
  ORIA_MESSAGES_STREAM: (chatId: string) =>
    `/oria/chats/${chatId}/message/stream`,

  ORIA_CHAT_TITLE: (chatId: string) => `/oria/chats/${chatId}/title`,
};
