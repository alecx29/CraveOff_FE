import { apiClient } from "@/src/axios/apiClient";
import { BackendRoutes } from "@/src/axios/backendRoutes";
import { MotivationalQuote } from "@/src/types/quotes";

export const quotesService = {
  /**
   * Get daily motivational quote
   */
  getDailyQuote: async (): Promise<MotivationalQuote> => {
    try {
      const response = await apiClient.get(BackendRoutes.DAILY_QUOTE);
      return response.data;
    } catch (error) {
      console.error("Error fetching daily quote:", error);
      // Return a fallback quote if the API fails
      return {
        id: 0,
        message: "Progress, not perfection, is the goal.",
        language: "en",
        category: "general",
        created_at: new Date().toISOString(),
      };
    }
  },
};

export default quotesService;
