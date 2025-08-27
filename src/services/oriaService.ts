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

      // Try streaming mode first, but allow fallback
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
        console.log("Message payload:", requestBody);

        const postResponse = await apiClient.post(messageUrl, requestBody);
        console.log("POST response status:", postResponse.status);
        console.log("POST response data:", postResponse.data);

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
        let messageBuffer: { data: string }[] = []; // Buffer for messages that arrive before handler is set
        
        const customEventSource: StreamEventSource = {
          onmessage: undefined, // Initialize as undefined
          onerror: undefined,
          onopen: undefined,
          close: () => {
            // Will be defined below
            console.log("Closing stream connection");
          },
        };

        // Override the onmessage setter to process buffered messages
        Object.defineProperty(customEventSource, 'onmessage', {
          get() {
            return this._onmessage;
          },
          set(handler) {
            console.log("🎯 onmessage handler being set, processing", messageBuffer.length, "buffered messages");
            this._onmessage = handler;
            
            // Process any buffered messages with throttling
            if (handler && messageBuffer.length > 0) {
              // Process buffered messages with a small delay to prevent overwhelming the UI
              messageBuffer.forEach((msg, index) => {
                setTimeout(() => {
                  console.log("📦 Processing buffered message", index + 1, "of", messageBuffer.length);
                  handler(msg);
                }, index * 10); // 10ms delay between messages
              });
              messageBuffer = []; // Clear buffer
            }
          }
        });

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
            xhr.setRequestHeader("Cache-Control", "no-cache");

            // Handle state changes - this is crucial for streaming
            xhr.onreadystatechange = () => {
              if (!isActive) return;
              
              console.log("XHR readyState:", xhr.readyState, "status:", xhr.status);
              
              // Check if we have a response and it's successful
              if (xhr.readyState >= 3 && xhr.status === 200) { // LOADING or DONE
                // Get any new data
                const newData = xhr.responseText.substring(buffer.length);
                if (newData) {
                  console.log("Received new data chunk:", newData.length, "characters");
                  buffer += newData;

                  // Process complete SSE messages
                  const lines = buffer.split("\n\n");
                  buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

                  for (const line of lines) {
                    if (line.trim() && line.startsWith("data:")) {
                      const data = line.substring(5).trim();
                      console.log("Processing SSE data:", data);

                      // Call onmessage handler if defined or buffer the message
                      if (customEventSource.onmessage && isActive) {
                        console.log("🚀 CALLING onmessage handler");
                        customEventSource.onmessage({ data });
                      } else if (isActive) {
                        console.log("📥 BUFFERING message - handler not set yet");
                        messageBuffer.push({ data });
                      }
                    }
                  }
                }
              }
            };

            // Handle completion
            xhr.onload = () => {
              if (isActive) {
                console.log("Stream complete - onload fired");
                isActive = false;
              }
            };

            // Handle errors
            xhr.onerror = (error) => {
              console.error("XHR Stream error:", error);
              console.error("XHR status:", xhr.status, "readyState:", xhr.readyState);
              if (customEventSource.onerror && isActive) {
                customEventSource.onerror(error);
              }
              isActive = false;
            };

            // Handle timeout
            xhr.ontimeout = () => {
              console.error("XHR Stream timeout");
              if (customEventSource.onerror && isActive) {
                customEventSource.onerror(new Error("Stream timeout"));
              }
              isActive = false;
            };

            // Set timeout to 30 seconds
            xhr.timeout = 30000;

            // Start the request
            console.log("Starting XHR request to:", streamingUrl);
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
