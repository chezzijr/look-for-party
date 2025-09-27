import { createFileRoute } from "@tanstack/react-router"

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <div className="w-full">
      <div className="pt-12 m-4">
        <h1 className="text-2xl font-semibold truncate max-w-sm">
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </h1>
        <p className="text-muted-foreground">Welcome back, nice to see you again!</p>
      </div>
    </div>
  )
}
