import { useQuery } from "@tanstack/react-query"
import { QuestsService } from "@/client"
import type { QuestsPublic } from "@/client"

export const useMyQuests = () => {
  return useQuery<QuestsPublic>({
    queryKey: ["my-quests"],
    queryFn: () => QuestsService.readMyQuests(),
  })
}

export default useMyQuests
