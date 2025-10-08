import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RatingsService, type RatingCreate } from "@/client"
import { toast } from "sonner"

/**
 * Hook to submit a rating for a party member
 * Invalidates rating queries and user reputation after successful submission
 */
export function useSubmitRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ratingData: RatingCreate) =>
      RatingsService.createRating({ requestBody: ratingData }),
    onSuccess: (_data, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["ratable-users", variables.party_id] })
      queryClient.invalidateQueries({ queryKey: ["user-rating-summary", variables.rated_user_id] })
      queryClient.invalidateQueries({ queryKey: ["user-received-ratings", variables.rated_user_id] })
      queryClient.invalidateQueries({ queryKey: ["party-ratings", variables.party_id] })

      toast.success("Rating submitted successfully")
    },
    onError: (error: any) => {
      const errorMessage = error?.body?.detail || "Failed to submit rating"
      toast.error(errorMessage)
    },
  })
}
