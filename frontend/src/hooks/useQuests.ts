import { useQuery } from "@tanstack/react-query"
import { QuestsService } from "@/client"
import type { QuestsPublic, QuestCategory, QuestStatus, LocationType } from "@/client"

interface QuestFilters {
  category?: QuestCategory
  location_type?: LocationType
  status?: QuestStatus
  limit?: number
  skip?: number
}

export const useQuests = (filters: QuestFilters = {}) => {
  return useQuery<QuestsPublic>({
    queryKey: ["quests", filters],
    queryFn: () => QuestsService.readQuests({
      category: filters.category || null,
      status: filters.status || null,
      locationType: filters.location_type || null,
      limit: filters.limit,
      skip: filters.skip,
    }),
  })
}

export default useQuests
