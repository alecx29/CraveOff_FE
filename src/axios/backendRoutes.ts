export const BackendRoutes = {
  LOGIN: "/auth/login",
  AUTHENTICATE: "/auth/authenticate",
  GOOGLE_LOGIN: "/auth/google-login",
  REGISTER: "/auth/signup",
  SIGNUP_ANALYSIS: "/signup/analysis",
  GOALS: "/auth/goals",
  FOOD_LIST: "/foods/",
  FOOD_LIST_TODAY: "/foods/today-macros",
  FOOD_LIST_7DAYS: "/foods/week-macros",
  LOGS: "/logs/",
  LAST_RELAPSE: "/profile/get-last-relapse",
  UPDATE_LAST_RELAPSE: "/profile/update-last-relapse",
  RELAPSE: "/profile/record-relapse",
  JOURNAL: "/journal/",
  PLEDGE: "/check-ins",
  DAILY_QUOTE: "/quote",

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
