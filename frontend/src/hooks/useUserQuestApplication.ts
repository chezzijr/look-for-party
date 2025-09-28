import { useQuery } from "@tanstack/react-query"
import { QuestApplicationsService } from "@/client"
import type { QuestApplicationPublic } from "@/client"
import useAuth from "./useAuth"

interface UseUserQuestApplicationOptions {
  questId: string
}

export const useUserQuestApplication = ({ questId }: UseUserQuestApplicationOptions) => {
  const { user } = useAuth()

  return useQuery<QuestApplicationPublic | null>({
    queryKey: ["user-quest-application", questId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      try {
        // Get all user's applications and find the one for this quest
        const applicationsData = await QuestApplicationsService.readMyApplications({})
        const applications = applicationsData.data || []

        // Find application for this specific quest
        const userApplication = applications.find(app => app.quest_id === questId)
        return userApplication || null
      } catch (error) {
        // If error (like 404), user has no applications
        return null
      }
    },
    enabled: !!user?.id && !!questId,
  })
}

export default useUserQuestApplication
