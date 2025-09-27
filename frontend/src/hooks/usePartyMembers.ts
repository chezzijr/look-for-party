import { useQuery } from "@tanstack/react-query"
import { PartiesService } from "@/client"
import type { PartyMembersPublic } from "@/client"

export const usePartyMembers = (partyId: string) => {
  return useQuery<PartyMembersPublic>({
    queryKey: ["party-members", partyId],
    queryFn: () => PartiesService.readPartyMembers({ partyId }),
    enabled: !!partyId,
  })
}

export default usePartyMembers
