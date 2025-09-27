import { createFileRoute } from "@tanstack/react-router"
import { QuestDetailPage } from "@/components/quest/QuestDetailPage"

export const Route = createFileRoute("/_layout/quests/$questId")({
  component: QuestDetail,
})

function QuestDetail() {
  const { questId } = Route.useParams()

  return <QuestDetailPage questId={questId} />
}
