import { useQuery } from "@tanstack/react-query"
import { QuestsService } from "@/client"
import type { QuestsPublic, QuestCategory, QuestStatus, LocationType } from "@/client"

interface QuestFilters {
  category?: QuestCategory
  location_type?: LocationType
  status?: QuestStatus
  search?: string
  party_size_min?: number
  party_size_max?: number
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
      search: filters.search || null,
      partySizeMin: filters.party_size_min || null,
      partySizeMax: filters.party_size_max || null,
      limit: filters.limit,
      skip: filters.skip,
    }),
  })
}

export default useQuests
