import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/quests")({
  component: Quests,
})

function Quests() {
  return <Outlet />
}
