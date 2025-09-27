import { useQuery } from "@tanstack/react-query"
import { QuestApplicationsService } from "@/client"
import type { QuestApplicationsPublic, ApplicationStatus } from "@/client"

interface UseQuestApplicationsOptions {
  questId: string
  status?: ApplicationStatus
}

export const useQuestApplications = ({ questId, status }: UseQuestApplicationsOptions) => {
  return useQuery<QuestApplicationsPublic>({
    queryKey: ["quest-applications", questId, status],
    queryFn: () => QuestApplicationsService.readQuestApplications({
      questId,
      status: status || null,
    }),
    enabled: !!questId,
  })
}

export default useQuestApplications
