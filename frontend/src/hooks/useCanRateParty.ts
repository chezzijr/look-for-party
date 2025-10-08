import { useQuery } from "@tanstack/react-query"
import { RatingsService } from "@/client"

/**
 * Hook to check if the current user can rate members in a specific party
 * Returns true if party is COMPLETED/ARCHIVED and user is a member
 */
export function useCanRateParty(partyId: string) {
  return useQuery<boolean>({
    queryKey: ["can-rate-party", partyId],
    queryFn: async () => {
      const response = await RatingsService.checkCanRateParty({ partyId })
      return response.can_rate ?? false
    },
    enabled: !!partyId,
  })
}
