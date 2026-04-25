# Backend Requirements

This frontend expects a separate backend service to provide the chat room
coordination endpoints below. Configure the backend origin with
`NEXT_PUBLIC_CHAT_API_BASE_URL`. When the variable is empty, requests are sent to
the same origin.

## POST /api/client-alias

Creates a stable public alias for one browser/client inside one room.

Request body:

```json
{
  "identifier": "client-id-from-local-storage",
  "roomId": "room-id"
}
```

Success response:

```json
{
  "alias": "stable-display-name"
}
```

Requirements:

- Return `400` when `identifier` or `roomId` is missing or not a string.
- Generate the same alias for the same `identifier` and `roomId`.
- Do not expose the raw client identifier to other clients.

## POST /api/rooms

Coordinates room ownership and destruction state.

Join request body:

```json
{
  "action": "join",
  "identifier": "client-id-from-local-storage",
  "roomId": "room-id"
}
```

Join success response:

```json
{
  "isDestroyed": false,
  "isOwner": true
}
```

Destroy request body:

```json
{
  "action": "destroy",
  "identifier": "client-id-from-local-storage",
  "roomId": "room-id"
}
```

Destroy success response:

```json
{
  "isDestroyed": true
}
```

Leave request body:

```json
{
  "action": "leave",
  "identifier": "client-id-from-local-storage",
  "roomId": "room-id"
}
```

Leave success response:

```json
{
  "hasLeft": true
}
```

Requirements:

- Return `400` when `action`, `identifier`, or `roomId` is missing or not a
  string.
- On first successful join, assign that `identifier` as the room owner.
- For later joins, return `isOwner: true` only for the owner.
- If the room has already been destroyed, join must return
  `{ "isDestroyed": true, "isOwner": false }`.
- Only the owner can destroy a room. Return `403` for non-owner destroy requests.
- Persist room state outside the frontend process.
- Apply appropriate CORS policy when `NEXT_PUBLIC_CHAT_API_BASE_URL` points to a
  different origin.

## GET /api/rooms/status

Returns the current state for a room.

Query parameters:

```text
roomId=room-id
```

Success response:

```json
{
  "expiresAt": "2026-04-25T12:30:00.000Z",
  "isDestroyed": false,
  "messageCount": 10,
  "serverTime": "2026-04-25T12:00:00.000Z"
}
```

Requirements:

- Return `400` when `roomId` is missing or not a string.
- Return `404` when the room does not exist.
- Return `isDestroyed: true` when the room has been destroyed.
- `expiresAt` must be an ISO timestamp.
- `messageCount` and `serverTime` are optional, but recommended.

## POST /api/messages

Sends a chat message to a room.

Request body:

```json
{
  "identifier": "client-id-from-local-storage",
  "roomId": "room-id",
  "body": "message text"
}
```

Success response:

```json
{
  "id": "message-id",
  "body": "message text",
  "senderName": "stable-display-name",
  "sentAt": "2026-04-25T12:00:00.000Z"
}
```

Requirements:

- Return `400` when `identifier`, `roomId`, or `body` is missing or not a
  string.
- Return `404` or `410` when the room does not exist or has been destroyed.
- Use the same stable display alias as `POST /api/client-alias` for
  `senderName`.
- Persist sent messages outside the frontend process.

## GET /api/messages

Returns the message history for a room.

Query parameters:

```text
roomId=room-id
```

Success response:

```json
{
  "messages": [
    {
      "id": "message-id",
      "body": "message text",
      "senderName": "stable-display-name",
      "sentAt": "2026-04-25T12:00:00.000Z"
    }
  ]
}
```

Requirements:

- Return `400` when `roomId` is missing or not a string.
- Return `404` or `410` when the room does not exist or has been destroyed.
- Return messages sorted from oldest to newest.

## GET /api/messages/stream

Streams new room messages using Server-Sent Events.

Query parameters:

```text
roomId=room-id
```

Event payload:

```text
event: message
data: {"id":"message-id","body":"message text","senderName":"stable-display-name","sentAt":"2026-04-25T12:00:00.000Z"}
```

Requirements:

- Return `400` when `roomId` is missing or not a string.
- Return `404` or `410` when the room does not exist or has been destroyed.
- Send each new message as a `message` event.
- Keep the connection open until the client disconnects or the room is
  destroyed.
- Apply appropriate CORS policy when `NEXT_PUBLIC_CHAT_API_BASE_URL` points to a
  different origin.
