import { useMemo } from "react"
import { usePartyQuestsByType } from "./usePartyQuests"
import type { QuestPublic } from "@/client"

/**
 * Hook to get incomplete quests for a party
 * Incomplete quests are those with status RECRUITING or IN_PROGRESS
 * Used to validate party completion eligibility
 */
export function useIncompletePartyQuests(partyId: string) {
  const { allQuests, isLoading, error } = usePartyQuestsByType(partyId)

  const incompleteQuests = useMemo(() => {
    if (!allQuests) return []

    return allQuests.filter((quest: QuestPublic) => {
      const status = quest.status
      // Only RECRUITING and IN_PROGRESS are considered incomplete
      return status === "RECRUITING" || status === "IN_PROGRESS"
    })
  }, [allQuests])

  const hasIncompleteQuests = incompleteQuests.length > 0

  return {
    incompleteQuests,
    hasIncompleteQuests,
    incompleteCount: incompleteQuests.length,
    isLoading,
    error,
  }
}
