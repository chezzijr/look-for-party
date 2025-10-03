import { useQuery } from "@tanstack/react-query"
import { UsersService, TagsService, RatingsService } from "@/client"
import type { UserPublic, UserTagsPublic, UserRatingSummary } from "@/client"

export interface ApplicantProfile {
  user: UserPublic | undefined
  tags: UserTagsPublic | undefined
  ratingSummary: UserRatingSummary | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Hook to fetch complete applicant profile including user data, tags, and rating summary
 */
export const useApplicantProfile = (applicantId: string | undefined): ApplicantProfile => {
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useQuery<UserPublic>({
    queryKey: ["user", applicantId],
    queryFn: () => UsersService.readUserById({ userId: applicantId! }),
    enabled: !!applicantId,
  })

  const {
    data: tags,
    isLoading: isTagsLoading,
    isError: isTagsError,
    error: tagsError,
  } = useQuery<UserTagsPublic>({
    queryKey: ["user-tags", applicantId],
    queryFn: () => TagsService.readUserTags({ userId: applicantId! }),
    enabled: !!applicantId,
  })

  const {
    data: ratingSummary,
    isLoading: isRatingsLoading,
    isError: isRatingsError,
    error: ratingsError,
  } = useQuery<UserRatingSummary>({
    queryKey: ["user-rating-summary", applicantId],
    queryFn: () => RatingsService.readUserRatingSummary({ userId: applicantId! }),
    enabled: !!applicantId,
  })

  const isLoading = isUserLoading || isTagsLoading || isRatingsLoading
  const isError = isUserError || isTagsError || isRatingsError
  const error = (userError || tagsError || ratingsError) as Error | null

  return {
    user,
    tags,
    ratingSummary,
    isLoading,
    isError,
    error,
  }
}
