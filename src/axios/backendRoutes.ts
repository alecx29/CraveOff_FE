export const BackendRoutes = {
  LOGIN: "/auth/login",
  AUTHENTICATE: "/auth/authenticate",
  GOOGLE_LOGIN: "/auth/google-login",
  DEV_LOGIN: "/auth/dev-login",
  REGISTER: "/auth/signup",
  REFRESH_TOKEN: "/auth/refresh",
  SIGNUP_ANALYSIS: "/signup/analysis",
  SIGNUP_COMPLETE: "/profile/signup-complete",
  GOALS: "/auth/goals",
  FOOD_LIST: "/foods/",
  FOOD_LIST_TODAY: "/foods/today-macros",
  FOOD_LIST_7DAYS: "/foods/week-macros",
  LOGS: "/logs/",
  LAST_RELAPSE: "/profile/get-last-relapse",
  UPDATE_LAST_RELAPSE: "/profile/last-relapse",
  RELAPSE: "/profile/record-relapse",
  JOURNAL: "/journal/",
  PLEDGE: "/pledge/",
  PLEDGE_HISTORY: "/pledge/history",
  DAILY_QUOTE: "/quote",

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
