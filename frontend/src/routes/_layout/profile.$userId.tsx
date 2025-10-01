import { createFileRoute } from "@tanstack/react-router"

import ProfilePage from "@/components/profile/ProfilePage"

export const Route = createFileRoute("/_layout/profile/$userId")({
  component: UserProfile,
  head: () => ({
    meta: [
      {
        title: "User Profile | Look For Party",
      },
    ],
  }),
})

function UserProfile() {
  const { userId } = Route.useParams()

  return <ProfilePage isOwnProfile={false} userId={userId} />
}
