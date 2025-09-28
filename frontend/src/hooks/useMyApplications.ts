import { useQuery } from "@tanstack/react-query"
import { QuestApplicationsService } from "@/client"
import type { QuestApplicationsPublic, ApplicationStatus } from "@/client"

interface UseMyApplicationsOptions {
  status?: ApplicationStatus
}

export const useMyApplications = (options: UseMyApplicationsOptions = {}) => {
  return useQuery<QuestApplicationsPublic>({
    queryKey: ["my-applications", options.status],
    queryFn: () => QuestApplicationsService.readMyApplications({
      status: options.status || null,
    }),
  })
}

export default useMyApplications
