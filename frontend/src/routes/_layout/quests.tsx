import { createFileRoute, Outlet } from "@tanstack/react-router"
import { QuestBoard } from "@/components/quest/QuestBoard"

export const Route = createFileRoute("/_layout/quests")({
  component: Quests,
})

function Quests() {
  return <Outlet />
}
