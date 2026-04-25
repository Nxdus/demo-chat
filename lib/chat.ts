const CHAT_API_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API_BASE_URL ?? "";

type RequestOptions = {
  signal?: AbortSignal;
};

type JsonBody = Record<string, string>;
type QueryParams = Record<string, string>;

type RoomMessageHandler = (message: RoomMessageResponse) => void;

export type JoinRoomResponse = {
  isDestroyed: boolean;
  isOwner: boolean;
};

export type DestroyRoomResponse = {
  isDestroyed: boolean;
};

export type LeaveRoomResponse = {
  hasLeft: boolean;
};

export type ClientAliasResponse = {
  alias: string;
};

export type RoomStatusResponse = {
  expiresAt: string;
  isDestroyed: boolean;
  messageCount?: number;
  serverTime?: string;
};

export type RoomMessageResponse = {
  id: string;
  body: string;
  senderName: string;
  sentAt: string;
};

export type RoomMessagesResponse = {
  messages: RoomMessageResponse[];
};

export type SendMessageResponse = {
  id: string;
  body: string;
  senderName: string;
  sentAt: string;
};

const apiUrl = (path: string) =>
  CHAT_API_BASE_URL ? new URL(path, CHAT_API_BASE_URL).toString() : path;

function apiUrlWithQuery(path: string, params: QueryParams) {
  const url = apiUrl(path);
  const query = new URLSearchParams(params).toString();

  return query ? `${url}?${query}` : url;
}

async function get<TResponse>(
  path: string,
  params: QueryParams,
  options: RequestOptions = {},
) {
  const response = await fetch(apiUrlWithQuery(path, params), {
    signal: options.signal,
  });

  return response.ok ? ((await response.json()) as TResponse) : null;
}

async function post<TResponse>(
  path: string,
  body: JsonBody,
  options: RequestOptions = {},
) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  return response.ok ? ((await response.json()) as TResponse) : null;
}

export function getClientAlias(
  identifier: string,
  roomId: string,
  options?: RequestOptions,
) {
  return post<ClientAliasResponse>("/api/client-alias", { identifier, roomId }, options);
}

export function getRoomStatus(roomId: string, options?: RequestOptions) {
  return get<RoomStatusResponse>("/api/rooms/status", { roomId }, options);
}

export function getRoomExpires(roomId: string, options?: RequestOptions) {
  return getRoomStatus(roomId, options);
}

export function getRoomMessages(
  roomId: string,
  options?: RequestOptions
) {
  return get<RoomMessagesResponse>("/api/messages", { roomId }, options);
}

export function joinRoom(
  identifier: string,
  roomId: string,
  options?: RequestOptions,
) {
  return post<JoinRoomResponse>("/api/rooms", { action: "join", identifier, roomId }, options);
}

export function destroyRoom(
  identifier: string,
  roomId: string
) {
  return post<DestroyRoomResponse>("/api/rooms", { action: "destroy", identifier, roomId });
}

export function leaveRoom(identifier: string, roomId: string) {
  return post<LeaveRoomResponse>("/api/rooms", { action: "leave", identifier, roomId });
}

export function sendMessage(
  identifier: string,
  roomId: string,
  body: string,
  options?: RequestOptions,
) {
  return post<SendMessageResponse>("/api/messages", { identifier, roomId, body }, options);
}

export function subscribeRoomMessages(
  roomId: string,
  onMessage: RoomMessageHandler,
) {
  const events = new EventSource(apiUrlWithQuery("/api/messages/stream", { roomId }));

  events.addEventListener("message", (event) => {
    onMessage(JSON.parse(event.data) as RoomMessageResponse);
  });

  return () => events.close();
}
