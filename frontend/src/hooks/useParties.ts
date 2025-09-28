import { useQuery } from "@tanstack/react-query"
import { PartiesService } from "@/client"
import type { PartiesPublic } from "@/client"

export const useParties = () => {
  return useQuery<PartiesPublic>({
    queryKey: ["parties", "my-parties"],
    queryFn: () => PartiesService.readMyParties(),
  })
}

export default useParties
