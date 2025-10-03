import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { TagsService } from "@/client"
import type { UserTagsPublic, QuestTagsPublic } from "@/client"
import {
  calculateSkillMatchScore,
  getSkillGaps,
  getPerfectMatches,
  type SkillMatchResult,
  type SkillGap,
  type PerfectMatch,
} from "@/utils/skillMatchingUtils"

export interface SkillMatchData {
  matchResult: SkillMatchResult | null
  skillGaps: SkillGap[]
  perfectMatches: PerfectMatch[]
  questTags: QuestTagsPublic | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * Hook to calculate skill match between user tags and quest requirements
 */
export const useSkillMatch = (
  userTags: UserTagsPublic | undefined,
  questId: string | undefined
): SkillMatchData => {
  const {
    data: questTags,
    isLoading,
    isError,
  } = useQuery<QuestTagsPublic>({
    queryKey: ["quest-tags", questId],
    queryFn: () => TagsService.readQuestTags({ questId: questId! }),
    enabled: !!questId,
  })

  const matchResult = useMemo(() => {
    if (!userTags?.data || !questTags?.data) return null
    return calculateSkillMatchScore(userTags.data, questTags.data)
  }, [userTags, questTags])

  const skillGaps = useMemo(() => {
    if (!userTags?.data || !questTags?.data) return []
    return getSkillGaps(userTags.data, questTags.data)
  }, [userTags, questTags])

  const perfectMatches = useMemo(() => {
    if (!userTags?.data || !questTags?.data) return []
    return getPerfectMatches(userTags.data, questTags.data)
  }, [userTags, questTags])

  return {
    matchResult,
    skillGaps,
    perfectMatches,
    questTags,
    isLoading,
    isError,
  }
}
