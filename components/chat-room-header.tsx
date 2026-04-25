"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, LogOut, Timer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  destroyRoom as requestDestroyRoom,
  getRoomStatus,
  joinRoom,
  leaveRoom,
} from "@/lib/chat";
import { getClientIdentifier } from "@/lib/client-identity";

type ChatRoomHeaderProps = {
  roomId: string;
  ttlSeconds: number;
};

function formatRemainingTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function secondsUntil(value: string) {
  const expiresAt = new Date(value).getTime();

  if (Number.isNaN(expiresAt)) {
    return 0;
  }

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export function ChatRoomHeader({
  roomId,
  ttlSeconds,
}: ChatRoomHeaderProps) {
  const router = useRouter();
  const [remainingSeconds, setRemainingSeconds] = useState(ttlSeconds);
  const [isOwner, setIsOwner] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);

  useEffect(() => {
    let expiresAt = Date.now() + ttlSeconds * 1000;

    const intervalId = window.setInterval(() => {
      const nextRemainingSeconds = Math.max(
        0,
        Math.ceil((expiresAt - Date.now()) / 1000),
      );

      setRemainingSeconds(nextRemainingSeconds);
    }, 1000);

    const controller = new AbortController();

    async function loadRoomStatus() {
      const data = await getRoomStatus(roomId, {
        signal: controller.signal,
      });

      if (!data) {
        return;
      }

      if (data.isDestroyed) {
        router.replace("/");
        return;
      }

      const nextExpiresAt = new Date(data.expiresAt).getTime();

      if (!Number.isNaN(nextExpiresAt)) {
        expiresAt = nextExpiresAt;
      }

      setRemainingSeconds(secondsUntil(data.expiresAt));
    }

    loadRoomStatus().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    });

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [roomId, router, ttlSeconds]);

  useEffect(() => {
    const controller = new AbortController();

    async function registerRoomJoin() {
      const data = await joinRoom(getClientIdentifier(), roomId, {
        signal: controller.signal,
      });

      if (!data) {
        return;
      }

      if (data.isDestroyed) {
        router.replace("/");
        return;
      }

      setIsOwner(data.isOwner);
    }

    registerRoomJoin().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    });

    return () => controller.abort();
  }, [roomId, router]);

  async function exitRoom() {
    await leaveRoom(getClientIdentifier(), roomId).catch(() => null);
    router.push("/");
  }

  async function handleDestroyRoom() {
    setIsDestroying(true);

    const data = await requestDestroyRoom(getClientIdentifier(), roomId);

    if (data) {
      router.replace("/");
      return;
    }

    setIsDestroying(false);
  }

  const isExpired = remainingSeconds === 0;

  return (
    <header className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">Room</p>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <Hash className="size-4 shrink-0 text-muted-foreground" />
          <h1 className="truncate font-mono text-xl font-semibold tracking-normal">
            {roomId}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {isOwner ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="flex-1 sm:flex-none"
              disabled={isDestroying}
              onClick={handleDestroyRoom}
            >
              <Trash2 />

            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="flex-1 sm:flex-none"
            onClick={exitRoom}
          >
            <LogOut />
          </Button>
        </div>
        <div
          className="flex w-full items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 text-card-foreground sm:w-auto sm:min-w-48"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="size-4" />
            <span>Expires in</span>
          </div>
          <span
            className={
              isExpired
                ? "font-mono text-sm font-semibold text-destructive"
                : "font-mono text-sm font-semibold"
            }
          >
            {isExpired ? "Expired" : formatRemainingTime(remainingSeconds)}
          </span>
        </div>
      </div>
    </header>
  );
}
