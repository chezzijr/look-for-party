import { useQuery } from "@tanstack/react-query"
import { QuestsService } from "@/client"
import type { QuestPublic } from "@/client"

export const useQuestDetail = (questId: string) => {
  return useQuery<QuestPublic>({
    queryKey: ["quest", questId],
    queryFn: () => QuestsService.readQuest({ questId }),
    enabled: !!questId,
  })
}

export default useQuestDetail
