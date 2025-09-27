import { createFileRoute } from "@tanstack/react-router"
import { QuestBoard } from "@/components/quest/QuestBoard"

export const Route = createFileRoute("/_layout/quests/")({
  component: QuestsIndex,
})

function QuestsIndex() {
  return (
    <div className="w-full">
      <div className="pt-12 m-4">
        <h1 className="text-2xl font-semibold mb-4">Quest Board</h1>
        <p className="text-muted-foreground mb-6">
          Discover and join quests to collaborate with others
        </p>
      </div>

      <div className="m-4">
        <QuestBoard />
      </div>
    </div>
  )
}
