import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/parties/$partyId')({
  component: PartyDetailLayout,
})

function PartyDetailLayout() {
  return <Outlet />
}
