import { useQuery } from "@tanstack/react-query"
import { PartiesService } from "@/client"
import type { PartyPublic } from "@/client"

export const usePartyDetail = (partyId: string) => {
  return useQuery<PartyPublic>({
    queryKey: ["party", partyId],
    queryFn: () => PartiesService.readParty({ partyId }),
    enabled: !!partyId,
  })
}

export default usePartyDetail
