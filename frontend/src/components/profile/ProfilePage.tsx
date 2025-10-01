import { useQuery } from "@tanstack/react-query"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

import { type UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"

import ProfileHeader from "./ProfileHeader"
import ProfileInfo from "./ProfileInfo"
import SkillTagManager from "./SkillTagManager"
import ReputationDisplay from "./ReputationDisplay"
import QuestHistory from "./QuestHistory"

interface ProfilePageProps {
  isOwnProfile: boolean
  userId?: string
}

export default function ProfilePage({ isOwnProfile, userId }: ProfilePageProps) {
  const { user: currentUser } = useAuth()

  // For own profile, use currentUser data. For other profiles, fetch user data
  const targetUserId = isOwnProfile ? currentUser?.id : userId

  // Fetch user profile data for public profiles
  const { data: profileUser, isLoading: isLoadingProfile } = useQuery<UserPublic>({
    queryKey: ["user-profile", targetUserId],
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error("User ID is required")
      }
      if (isOwnProfile) {
        // For own profile, we already have the user data
        return currentUser as UserPublic
      } else {
        // For other profiles, we'd need a getUserProfile endpoint
        // For now, we'll use the same user data structure
        return currentUser as UserPublic
      }
    },
    enabled: !!targetUserId,
  })

  if (isLoadingProfile) {
    return <ProfileSkeleton />
  }

  if (!profileUser || !targetUserId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <ProfileHeader user={profileUser} isOwnProfile={isOwnProfile} />

      <Tabs defaultValue="profile" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="reputation">Reputation</TabsTrigger>
          <TabsTrigger value="quests">Quest History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileInfo user={profileUser} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillTagManager userId={targetUserId} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="reputation" className="mt-6">
          <ReputationDisplay userId={targetUserId} />
        </TabsContent>

        <TabsContent value="quests" className="mt-6">
          <QuestHistory userId={targetUserId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}
