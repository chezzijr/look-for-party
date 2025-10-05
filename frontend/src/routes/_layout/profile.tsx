import { createFileRoute } from "@tanstack/react-router"

import ProfilePage from "@/components/profile/ProfilePage"

export const Route = createFileRoute("/_layout/profile")({
  component: MyProfile,
  head: () => ({
    meta: [
      {
        title: "My Profile | Look For Party",
      },
    ],
  }),
})

function MyProfile() {
  return <ProfilePage isOwnProfile={true} />
}
