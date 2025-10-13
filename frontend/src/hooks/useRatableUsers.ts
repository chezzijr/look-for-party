import { useQuery } from "@tanstack/react-query"
import { RatingsService, type User } from "@/client"

/**
 * Hook to fetch users that the current user can rate in a specific party
 * Excludes self and already rated users
 */
export function useRatableUsers(partyId: string) {
  return useQuery<User[]>({
    queryKey: ["ratable-users", partyId],
    queryFn: () => RatingsService.getRatableUsersForParty({ partyId }),
    enabled: !!partyId,
  })
}
