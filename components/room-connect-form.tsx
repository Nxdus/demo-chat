"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Dice5 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function generateRoomId() {
  return crypto.randomUUID().slice(0, 8);
}

export function RoomConnectForm() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextRoomId = roomId.trim();

    if (!nextRoomId) {
      return;
    }

    router.push(`/chats/${encodeURIComponent(nextRoomId)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="roomId">Room ID</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="roomId"
              name="roomId"
              type="text"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="Enter room ID or generate a new one"
              autoComplete="off"
              required
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Generate room ID"
              title="Generate room ID"
              onClick={() => setRoomId(generateRoomId())}
            >
              <Dice5 />
            </Button>
          </div>
        </Field>
        <Button type="submit" className="w-full">
          Connect
        </Button>
      </FieldGroup>
    </form>
  );
}
