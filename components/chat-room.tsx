"use client";

import { useEffect, useState } from "react";

import { ChatMessageFooter } from "@/components/chat-message-footer";
import {
  getClientAlias,
  getRoomMessages,
  sendMessage,
  subscribeRoomMessages,
} from "@/lib/chat";
import { getClientIdentifier } from "@/lib/client-identity";

type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  sentAt: string;
};

type ChatRoomProps = {
  roomId: string;
};

const DEFAULT_USERNAME = "user-pending";

function formatSentTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : formatSentTime(date);
}

function toChatMessage(message: ChatMessage) {
  return {
    ...message,
    sentAt: formatMessageTime(message.sentAt),
  };
}

function appendUniqueMessage(messages: ChatMessage[], message: ChatMessage) {
  if (messages.some((currentMessage) => currentMessage.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoomData() {
      const identifier = getClientIdentifier();
      const [aliasData, messagesData] = await Promise.all([
        getClientAlias(identifier, roomId, {
          signal: controller.signal,
        }),
        getRoomMessages(roomId, {
          signal: controller.signal,
        }),
      ]);

      if (aliasData) {
        setUsername(aliasData.alias);
      }

      if (messagesData) {
        setMessages(messagesData.messages.map(toChatMessage));
      }
    }

    loadRoomData().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    });

    return () => controller.abort();
  }, [roomId]);

  useEffect(() => {
    return subscribeRoomMessages(roomId, (message) => {
      setMessages((currentMessages) =>
        appendUniqueMessage(currentMessages, toChatMessage(message)),
      );
    });
  }, [roomId]);

  async function handleSendMessage(body: string) {
    const data = await sendMessage(getClientIdentifier(), roomId, body).catch(
      () => null,
    );

    if (!data) {
      return false;
    }

    setMessages((currentMessages) =>
      appendUniqueMessage(currentMessages, {
        id: data.id,
        body: data.body,
        senderName: data.senderName || username,
        sentAt: formatMessageTime(data.sentAt),
      }),
    );

    return true;
  }

  return (
    <>
      <section
        className="min-h-0 flex-1 overflow-y-auto py-4"
        aria-label="Messages"
      >
        {messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className="ml-auto flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[70%]"
              >
                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <span className="max-w-36 truncate font-mono">
                    {message.senderName}
                  </span>
                  <time>{message.sentAt}</time>
                </div>
                <p className="whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm leading-6 text-primary-foreground">
                  {message.body}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-80 items-center justify-center text-sm text-muted-foreground">
            No messages yet
          </div>
        )}
      </section>
      <ChatMessageFooter onSendMessage={handleSendMessage} />
    </>
  );
}
