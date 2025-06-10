# Oria AI Chat with Streaming Support

This document explains how to use and configure the streaming mode for the Oria AI chat in the CraveOff app.

## Overview

The app now supports two modes for receiving Oria AI responses:

1. **Regular Mode**: The entire response is received at once after processing completes.
2. **Streaming Mode**: The response is received incrementally as it's being generated, providing a typing-like experience.

## Configuration

The mode is controlled by the `STREAMING_MODE` configuration variable, which can be set in either:

### Option 1: Using .env File (Recommended)

Create or edit your `.env` file in the project root and add:

```
STREAMING_MODE=true  # or false to disable streaming
```

The app will check the .env file first for this setting.

### Option 2: Using app.json Configuration

Alternatively, you can set it in the `extra` section of `app.json`:

```json
"extra": {
  "STREAMING_MODE": "true"  // Set to "false" to disable streaming
}
```

Note: If both are set, the value in the `.env` file will take precedence.

### Steps to Enable/Disable Streaming

1. Set `STREAMING_MODE` to `"true"` or `"false"` in either .env or app.json
2. Restart the app for changes to take effect

## Features

### Regular Mode (`STREAMING_MODE: "false"`)

- The entire message is received at once
- Simpler implementation
- Less real-time but more efficient for network usage
- Uses a single endpoint: `/oria/chats/{chatId}/message` (POST method)

### Streaming Mode (`STREAMING_MODE: "true"`)

- Messages appear incrementally in real-time
- Provides a more interactive experience
- Allows for stopping generation mid-response
- Uses Server-Sent Events (SSE) for efficient streaming
- Uses a two-step process:
  1. Send the message using `/oria/chats/{chatId}/message` (POST method)
  2. Connect to `/oria/chats/{chatId}/message/stream` to receive the streaming response (GET method with SSE)

## Technical Implementation

Streaming mode uses a two-step approach due to the limitations of Server-Sent Events:

1. **Send the message**: First, the app sends the message content using a standard POST request to the message endpoint.

2. **Receive the streaming response**: Then, it establishes an SSE connection using EventSource to receive the AI's response in real-time.

This implementation handles:

- Real-time display of partial responses
- Error handling
- Connection cleanup
- Ability to stop generation mid-response
- Loading indicator (pulsating white dot) while waiting for the first response chunk

## Note for Backend Developers

The backend must support both endpoints:

1. `/oria/chats/{chatId}/message` - For sending messages (POST method)
2. `/oria/chats/{chatId}/message/stream` - For receiving streaming responses (GET method with SSE)

### Authentication for Streaming

Since EventSource doesn't support custom headers, the authentication token is passed as a query parameter:

```
/oria/chats/{chatId}/message/stream?token=YOUR_AUTH_TOKEN
```

The backend should:

1. Validate the token from the query parameter
2. Process the message sent to the first endpoint
3. Stream the AI's response through the second endpoint when the client connects

Each streaming chunk should include:

- `id`: Message ID
- `role`: Always "assistant"
- `content`: The content chunk
- `done`: Boolean indicating if this is the last chunk

## Troubleshooting

If you encounter issues with streaming mode:

1. Check that the backend supports streaming responses
2. Verify network connectivity
3. Check browser/device compatibility with SSE
4. Try disabling streaming mode temporarily

For developers: Check the console logs for any errors related to the EventSource.
