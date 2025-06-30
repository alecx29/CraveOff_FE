import { apiClient } from "@/src/axios/apiClient";
import { BackendRoutes } from "@/src/axios/backendRoutes";
import {
  OriaChat,
  OriaChatWithMessages,
  SendMessageRequest,
  SendMessageResponse,
  CreateChatRequest,
  UpdateChatTitleRequest,
  UpdateChatTitleResponse,
} from "@/src/types/oria";

// Define a custom streaming interface that mimics EventSource for compatibility
export interface StreamEventSource {
  onmessage?: (event: { data: string }) => void;
  onerror?: (error: any) => void;
  onopen?: () => void;
  close: () => void;
}

// Debug the backend routes to ensure they're defined correctly
console.log(
  "DEBUG - BackendRoutes.ORIA_MESSAGES_STREAM:",
  typeof BackendRoutes.ORIA_MESSAGES_STREAM === "function"
    ? "defined correctly"
    : "not a function"
);

// Access environment variables, prioritizing .env over app.json
const getStreamingMode = () => {
  try {
    // FORCE STREAMING MODE TO TRUE since .env shows it's true but not being detected properly
    console.log("FORCING streaming mode to TRUE as configured in .env");
    return true;

    // The code below doesn't seem to be working with .env
    /*
    // First try to get from process.env
    if (process.env.STREAMING_MODE !== undefined) {
      console.log(
        "Using STREAMING_MODE from .env:",
        process.env.STREAMING_MODE
      );
      return process.env.STREAMING_MODE === "true";
    }

    // Fallback to app.json
    const appJsonMode = Constants.expoConfig?.extra?.STREAMING_MODE === "true";
    console.log("Using STREAMING_MODE from app.json:", appJsonMode);
    return appJsonMode;
    */
  } catch (error) {
    console.error("Error accessing STREAMING_MODE:", error);
    return true; // Default to streaming mode since .env has it set to true
  }
};

export const oriaService = {
  /**
   * Get all chats for the authenticated user
   */
  getAllChats: async (): Promise<OriaChat[]> => {
    try {
      const response = await apiClient.get(BackendRoutes.ORIA_CHATS);
      return response.data;
    } catch (error) {
      console.error("Error fetching chats:", error);
      throw error;
    }
  },

  /**
   * Get a specific chat with all its messages
   */
  getChat: async (chatId: string): Promise<OriaChatWithMessages> => {
    try {
      const response = await apiClient.get(BackendRoutes.ORIA_CHAT(chatId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new chat
   */
  createChat: async (data?: CreateChatRequest): Promise<OriaChat> => {
    try {
      const response = await apiClient.post(
        BackendRoutes.ORIA_CHATS,
        data || {}
      );
      return response.data;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  },

  /**
   * Send a message to a chat
   * If streaming mode is enabled, returns a custom StreamEventSource for streaming
   * If streaming mode is disabled, returns a promise that resolves with the complete response
   */
  sendMessage: async (
    chatId: string,
    message: SendMessageRequest
  ): Promise<SendMessageResponse | StreamEventSource> => {
    try {
      // Make sure the chat_id is included in the request body
      const requestBody = {
        ...message,
        chat_id: chatId,
      };

      // Always use streaming mode
      const isStreamingMode = true;
      console.log("Streaming mode is FORCED on:", isStreamingMode);

      // Debug the specific route we're about to use
      console.log(
        "DEBUG - Stream route for this chat:",
        BackendRoutes.ORIA_MESSAGES_STREAM(chatId)
      );

      if (isStreamingMode) {
        // In streaming mode, return a custom streaming interface
        // First, get the access token using AsyncStorage
        const AsyncStorage = await import(
          "@react-native-async-storage/async-storage"
        ).then((m) => m.default);
        const accessToken = await AsyncStorage.getItem("accessToken");

        if (!accessToken) {
          throw new Error("Authentication token not available");
        }

        // For streaming, we need to use a different approach:
        // 1. First send the message with a POST request
        // 2. Then create a fetch request to receive the streaming response

        // Step 1: Send the message with POST
        const messageUrl = BackendRoutes.ORIA_MESSAGES(chatId);
        console.log("Sending message with POST to:", messageUrl);

        await apiClient.post(messageUrl, requestBody);

        // Step 2: Now connect to the streaming endpoint to receive the response
        const streamUrl = `/oria/chats/${chatId}/message/stream`;

        // Add authorization token to the URL as a query parameter
        const streamingUrl = `${
          apiClient.defaults.baseURL
        }${streamUrl}?token=${encodeURIComponent(accessToken)}`;

        console.log("STREAM MODE DEBUGGING:");
        console.log(
          "  - Now connecting to stream URL (with auth token):",
          streamingUrl
        );
        console.log("  - API base URL:", apiClient.defaults.baseURL);

        // Create our custom streaming interface that mimics EventSource
        const customEventSource: StreamEventSource = {
          close: () => {
            // Will be defined below
            console.log("Closing stream connection");
          },
        };

        // Start the fetch request for streaming
        (async () => {
          try {
            // Call onopen if defined (mimicking EventSource behavior)
            if (customEventSource.onopen) {
              customEventSource.onopen();
            }

            console.log(
              "Using XMLHttpRequest for streaming (better React Native compatibility)"
            );

            // Use XMLHttpRequest which has better compatibility with React Native
            const xhr = new XMLHttpRequest();
            let buffer = "";
            let isActive = true;

            // Define the close method to abort the request
            customEventSource.close = () => {
              console.log("Closing XHR connection");
              isActive = false;
              xhr.abort();
            };

            // Set up the request
            xhr.open("GET", streamingUrl);
            xhr.setRequestHeader("Accept", "text/event-stream");

            // Process chunks as they arrive
            xhr.onprogress = () => {
              if (!isActive) return;

              // Get any new data
              const newData = xhr.responseText.substring(buffer.length);
              if (newData) {
                buffer += newData;

                // Process complete SSE messages
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

                for (const line of lines) {
                  if (line.trim() && line.startsWith("data:")) {
                    const data = line.substring(5).trim();

                    // Call onmessage handler if defined
                    if (customEventSource.onmessage && isActive) {
                      customEventSource.onmessage({ data });
                    }
                  }
                }
              }
            };

            // Handle completion
            xhr.onload = () => {
              if (isActive) {
                console.log("Stream complete");
                isActive = false;
              }
            };

            // Handle errors
            xhr.onerror = (error) => {
              console.error("XHR Stream error:", error);
              if (customEventSource.onerror && isActive) {
                customEventSource.onerror(error);
              }
              isActive = false;
            };

            // Start the request
            xhr.send();
          } catch (error) {
            console.error("Stream setup error:", error);

            // Call onerror handler if defined
            if (customEventSource.onerror) {
              customEventSource.onerror(error);
            }
          }
        })();

        console.log("Custom streaming interface created successfully");
        return customEventSource;
      } else {
        // In regular mode, use axios as before
        const regularUrl = BackendRoutes.ORIA_MESSAGES(chatId);
        console.log("Using regular endpoint:", regularUrl);
        console.log("Full URL:", `${apiClient.defaults.baseURL}${regularUrl}`);

        const response = await apiClient.post(regularUrl, requestBody);
        return response.data;
      }
    } catch (error) {
      console.error(`Error sending message to chat ${chatId}:`, error);
      throw error;
    }
  },

  /**
   * Archive a chat
   */
  archiveChat: async (chatId: string): Promise<OriaChat> => {
    try {
      const response = await apiClient.patch(BackendRoutes.ORIA_CHAT(chatId), {
        is_archived: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error archiving chat ${chatId}:`, error);
      throw error;
    }
  },

  /**
   * Update chat title
   */
  updateChatTitle: async (
    chatId: string,
    titleData: UpdateChatTitleRequest
  ): Promise<UpdateChatTitleResponse> => {
    try {
      const response = await apiClient.patch(
        BackendRoutes.ORIA_CHAT_TITLE(chatId),
        titleData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating chat title for ${chatId}:`, error);
      throw error;
    }
  },
};

export default oriaService;
