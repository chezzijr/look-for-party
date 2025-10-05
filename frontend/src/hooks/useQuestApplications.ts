import { useQuery } from "@tanstack/react-query"
import { QuestApplicationsService } from "@/client"
import type { QuestApplicationsPublic, ApplicationStatus } from "@/client"

interface UseQuestApplicationsOptions {
  questId: string
  status?: ApplicationStatus
}

interface UseQuestApplicationsQueryOptions {
  enabled?: boolean
}

export const useQuestApplications = (
  { questId, status }: UseQuestApplicationsOptions,
  options?: UseQuestApplicationsQueryOptions
) => {
  return useQuery<QuestApplicationsPublic>({
    queryKey: ["quest-applications", questId, status],
    queryFn: () => QuestApplicationsService.readQuestApplications({
      questId,
      status: status || null,
    }),
    enabled: (options?.enabled ?? true) && !!questId,
  })
}

export default useQuestApplications
