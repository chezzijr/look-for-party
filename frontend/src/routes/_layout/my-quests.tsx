import { createFileRoute } from "@tanstack/react-router"
import { QuestManagement } from "@/components/application/QuestManagement"

export const Route = createFileRoute("/_layout/my-quests")({
  component: MyQuests,
  head: () => ({
    meta: [
      {
        title: "My Quests | Look For Party",
      },
    ],
  }),
})

function MyQuests() {
  return (
    <div className="w-full">
      <div className="p-4 md:p-6">
        <QuestManagement />
      </div>
    </div>
  )
}
