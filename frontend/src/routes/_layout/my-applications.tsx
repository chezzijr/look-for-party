import { createFileRoute } from "@tanstack/react-router"
import { ApplicationDashboard } from "@/components/application/ApplicationDashboard"

export const Route = createFileRoute("/_layout/my-applications")({
  component: MyApplications,
  head: () => ({
    meta: [
      {
        title: "My Applications | Look For Party",
      },
    ],
  }),
})

function MyApplications() {
  return (
    <div className="w-full">
      <div className="p-4 md:p-6">
        <ApplicationDashboard />
      </div>
    </div>
  )
}
