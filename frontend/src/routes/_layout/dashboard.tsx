import { createFileRoute } from "@tanstack/react-router"

import useAuth from "@/hooks/useAuth"
import useParties from "@/hooks/useParties"
import { PartyCard } from "@/components/party/PartyCard"
import { EmptyParties } from "@/components/party/EmptyParties"

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const { data: partiesData, isLoading } = useParties()

  const parties = partiesData?.data || []

  return (
    <div className="w-full">
      <div className="pt-12 m-4">
        <h1 className="text-2xl font-semibold truncate max-w-sm">
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </h1>
        <p className="text-muted-foreground">Welcome back, nice to see you again!</p>
      </div>

      <div className="m-4">
        <h2 className="text-xl font-semibold mb-4">Your Parties</h2>

        {isLoading ? (
          <div className="text-muted-foreground">Loading parties...</div>
        ) : parties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parties.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                onClick={() => {
                  // TODO: Navigate to party detail page
                  console.log("Navigate to party:", party.id)
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyParties />
        )}
      </div>
    </div>
  )
}
