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

// Normalize different backend payload shapes into SendMessageResponse
const normalizeSendMessageResponse = (data: any): SendMessageResponse => {
  // Direct shape (non-streaming backend returns content here)
  if (data && typeof data === "object" && typeof data.content === "string") {
    const id = data.id ?? data.message_id ?? `temp-${Date.now()}`;
    const role = (data.role ??
      data.message?.role ??
      "assistant") as "assistant";
    const content = data.content;
    const createdAtRaw =
      data.created_at ??
      data.createdAt ??
      data.message?.created_at ??
      data.message?.createdAt;
    const created_at =
      createdAtRaw && !isNaN(new Date(createdAtRaw).getTime())
        ? String(createdAtRaw)
        : new Date().toISOString();
    return { id, role, content, created_at };
  }

  // Wrapped under message
  if (data?.message) {
    const m = data.message;
    const id = m.id ?? `temp-${Date.now()}`;
    const role = (m.role ?? "assistant") as "assistant";
    const content = typeof m.content === "string" ? m.content : "";
    const createdAtRaw = m.created_at ?? m.createdAt;
    const created_at =
      createdAtRaw && !isNaN(new Date(createdAtRaw).getTime())
        ? String(createdAtRaw)
        : new Date().toISOString();
    return { id, role, content, created_at };
  }

  // Assistant message key variants
  const assistant =
    data?.assistant || data?.assistant_message || data?.assistantMessage;
  if (assistant) {
    const id = assistant.id ?? `temp-${Date.now()}`;
    const role = (assistant.role ?? "assistant") as "assistant";
    const content =
      typeof assistant.content === "string" ? assistant.content : "";
    const createdAtRaw = assistant.created_at ?? assistant.createdAt;
    const created_at =
      createdAtRaw && !isNaN(new Date(createdAtRaw).getTime())
        ? String(createdAtRaw)
        : new Date().toISOString();
    return { id, role, content, created_at };
  }

  // Entire chat returned - pick last assistant message
  const chat =
    data?.chat ||
    (Array.isArray(data?.messages) ? { messages: data.messages } : null);
  if (
    chat?.messages &&
    Array.isArray(chat.messages) &&
    chat.messages.length > 0
  ) {
    const messages = chat.messages;
    const lastAssistant =
      [...messages]
        .reverse()
        .find((m: any) => (m.role ?? "assistant") === "assistant") ||
      messages[messages.length - 1];
    const id = lastAssistant.id ?? `temp-${Date.now()}`;
    const role = (lastAssistant.role ?? "assistant") as "assistant";
    const content =
      typeof lastAssistant.content === "string" ? lastAssistant.content : "";
    const createdAtRaw = lastAssistant.created_at ?? lastAssistant.createdAt;
    const created_at =
      createdAtRaw && !isNaN(new Date(createdAtRaw).getTime())
        ? String(createdAtRaw)
        : new Date().toISOString();
    return { id, role, content, created_at };
  }

  // Fallback minimal
  return {
    id: `temp-${Date.now()}`,
    role: "assistant",
    content: typeof data === "string" ? data : "",
    created_at: new Date().toISOString(),
  };
};

// Access environment variables, prioritizing .env over app config
const getStreamingMode = () => {
  try {
    // Prefer explicit env var if provided (via react-native-dotenv or runtime env)
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.STREAMING_MODE !== undefined
    ) {
      const fromEnv = String(process.env.STREAMING_MODE).toLowerCase();
      const envVal = fromEnv === "true" || fromEnv === "1";
      console.log("Using STREAMING_MODE from process.env:", envVal);
      return envVal;
    }

    // Fallback to Expo config extra
    // Lazy require to avoid bundling issues
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Constants = require("expo-constants").default;
      const extraVal = Constants?.expoConfig?.extra?.STREAMING_MODE;
      const extraBool =
        String(extraVal).toLowerCase() === "true" || String(extraVal) === "1";
      console.log("Using STREAMING_MODE from app.config extra:", extraBool);
      return extraBool;
    } catch (e) {
      console.log(
        "expo-constants not available for STREAMING_MODE; defaulting to false"
      );
      return false;
    }
  } catch (error) {
    console.error("Error accessing STREAMING_MODE:", error);
    return false;
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

      // Determine if streaming is enabled
      const isStreamingMode = getStreamingMode();
      console.log("Streaming mode:", isStreamingMode);

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
        Object.defineProperty(customEventSource, "onmessage", {
          get() {
            return this._onmessage;
          },
          set(handler) {
            console.log(
              "🎯 onmessage handler being set, processing",
              messageBuffer.length,
              "buffered messages"
            );
            this._onmessage = handler;

            // Process any buffered messages with throttling
            if (handler && messageBuffer.length > 0) {
              // Process buffered messages with a small delay to prevent overwhelming the UI
              messageBuffer.forEach((msg, index) => {
                setTimeout(() => {
                  console.log(
                    "📦 Processing buffered message",
                    index + 1,
                    "of",
                    messageBuffer.length
                  );
                  handler(msg);
                }, index * 10); // 10ms delay between messages
              });
              messageBuffer = []; // Clear buffer
            }
          },
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

              console.log(
                "XHR readyState:",
                xhr.readyState,
                "status:",
                xhr.status
              );

              // Check if we have a response and it's successful
              if (xhr.readyState >= 3 && xhr.status === 200) {
                // LOADING or DONE
                // Get any new data
                const newData = xhr.responseText.substring(buffer.length);
                if (newData) {
                  console.log(
                    "Received new data chunk:",
                    newData.length,
                    "characters"
                  );
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
                        console.log(
                          "📥 BUFFERING message - handler not set yet"
                        );
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
              console.error(
                "XHR status:",
                xhr.status,
                "readyState:",
                xhr.readyState
              );
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
        // In regular mode, use axios and return normalized message payload
        const regularUrl = BackendRoutes.ORIA_MESSAGES(chatId);
        console.log("Using regular endpoint (non-streaming):", regularUrl);
        const response = await apiClient.post(regularUrl, requestBody);
        try {
          const raw = response?.data;
          const keys = raw && typeof raw === "object" ? Object.keys(raw) : [];
          const preview =
            typeof raw?.content === "string"
              ? raw.content.slice(0, 120)
              : undefined;
          console.log("Non-streaming raw response keys:", keys);
          console.log(
            "Non-streaming raw content length:",
            typeof raw?.content === "string" ? raw.content.length : -1
          );
          if (preview !== undefined)
            console.log("Non-streaming raw content preview:", preview);
          if (raw && raw.assistant_message) {
            const am = raw.assistant_message;
            const amKeys = am && typeof am === "object" ? Object.keys(am) : [];
            const amLen =
              typeof am?.content === "string" ? am.content.length : -1;
            console.log("Non-streaming assistant_message keys:", amKeys);
            console.log(
              "Non-streaming assistant_message.content length:",
              amLen
            );
            if (typeof am?.content === "string") {
              const amPreview = am.content.slice(0, 120);
              console.log(
                "Non-streaming assistant_message.content preview:",
                amPreview
              );
            }
          }
        } catch {}
        // Prefer explicit mapping when backend returns assistant_message
        // Case 1: assistant_message is a plain string containing the content
        if (
          response?.data &&
          typeof response.data.assistant_message === "string"
        ) {
          const content = response.data.assistant_message as string;
          const mapped: SendMessageResponse = {
            id: `temp-${Date.now()}`,
            role: "assistant",
            content,
            created_at: new Date().toISOString(),
          };
          console.log("Mapped from assistant_message (string):", {
            id: mapped.id,
            len: mapped.content.length,
            time: mapped.created_at,
          });
          return mapped;
        }
        // Case 2: assistant_message is an object with .content
        if (
          response?.data &&
          response.data.assistant_message &&
          typeof response.data.assistant_message.content === "string"
        ) {
          const am = response.data.assistant_message;
          const mapped: SendMessageResponse = {
            id: am.id ?? `temp-${Date.now()}`,
            role: (am.role ?? "assistant") as "assistant",
            content: am.content,
            created_at: am.created_at ?? new Date().toISOString(),
          };
          console.log("Mapped from assistant_message:", mapped);
          return mapped;
        }
        const normalized = normalizeSendMessageResponse(response.data);
        console.log("Normalized non-streaming response:", normalized);
        return normalized;
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
