import { ChatRoomHeader } from "@/components/chat-room-header"
import { ChatRoom } from "@/components/chat-room"

type ChatRoomPageProps = {
    params: Promise<{
        room: string[]
    }>
}

const ROOM_TTL_SECONDS = 30 * 60

export default async function Page({ params }: ChatRoomPageProps) {
    const { room } = await params
    const roomId = room[0]

    return (
        <main className="flex min-h-dvh flex-col px-4">
            <ChatRoomHeader
                roomId={roomId}
                ttlSeconds={ROOM_TTL_SECONDS}
            />
            <ChatRoom roomId={roomId} />
        </main>
    )
}
