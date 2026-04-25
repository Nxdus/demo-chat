"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Laugh, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessageFooterProps = {
  onSendMessage: (message: string) => boolean | Promise<boolean>;
};

const EMOJIS = [
  "\u{1F600}",
  "\u{1F602}",
  "\u{1F60D}",
  "\u{1F970}",
  "\u{1F60E}",
  "\u{1F62D}",
  "\u{1F605}",
  "\u{1F979}",
  "\u{1F621}",
  "\u{1F44D}",
  "\u{1F44F}",
  "\u{1F64F}",
  "\u{1F525}",
  "\u{2728}",
  "\u{1F389}",
  "\u{2764}\u{FE0F}",
  "\u{1F4AF}",
  "\u{1F440}",
  "\u{1F914}",
  "\u{1F64C}",
  "\u{1F634}",
  "\u{1F60B}",
  "\u{1F92F}",
  "\u{1F4AC}",
];

export function ChatMessageFooter({
  onSendMessage,
}: ChatMessageFooterProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!footerRef.current?.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsEmojiPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function addEmoji(emoji: string) {
    setMessage((currentMessage) => `${currentMessage}${emoji}`);
    inputRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const wasSent = await onSendMessage(message.trim());

      if (wasSent) {
        setMessage("");
        setIsEmojiPickerOpen(false);
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <footer
      ref={footerRef}
      className="sticky bottom-0 border-t bg-background/95 py-3 backdrop-blur"
    >
      <div className="relative">
        {isEmojiPickerOpen ? (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm border bg-popover p-3 rounded-sm text-popover-foreground shadow-lg sm:left-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Emoji</p>
              <span className="text-xs text-muted-foreground">Tap to add</span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex aspect-square items-center justify-center text-xl transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Add ${emoji}`}
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Button
              type="button"
              variant="link"
              size="icon-sm"
              className="absolute left-1.5 top-1.5"
              aria-label="Open emoji picker"
              aria-expanded={isEmojiPickerOpen}
              onClick={() => setIsEmojiPickerOpen((isOpen) => !isOpen)}
            >
              <Laugh />
            </Button>
            <Input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message..."
              autoComplete="off"
              disabled={isSending}
              className="h-11 pl-12 pr-4"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!message.trim() || isSending}
          >
            <SendHorizontal />
          </Button>
        </form>
      </div>
    </footer>
  );
}
