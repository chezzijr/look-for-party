import { createFileRoute } from '@tanstack/react-router'
import { PartyDashboard } from '@/components/party/PartyDashboard'

export const Route = createFileRoute('/_layout/parties/$partyId')({
  component: PartyDetailPage,
  head: () => ({
    meta: [
      {
        title: "Party Dashboard | Look For Party",
      },
    ],
  }),
})

function PartyDetailPage() {
  const { partyId } = Route.useParams()

  return <PartyDashboard partyId={partyId} />
}
