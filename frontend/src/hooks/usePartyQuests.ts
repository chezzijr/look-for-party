import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PartiesService, QuestsService, type QuestPublic } from "@/client"
import { toast } from "sonner"
import { parseApiError } from "@/utils/apiErrors"

interface UsePartyQuestsOptions {
  partyId: string
  questType?: "PARTY_INTERNAL" | "PARTY_EXPANSION" | "PARTY_HYBRID"
}

interface PartyQuestCreateData {
  title: string
  description: string
  objective: string
  category: "GAMING" | "PROFESSIONAL" | "SOCIAL" | "LEARNING" | "CREATIVE" | "FITNESS" | "TRAVEL"
  quest_type: "PARTY_INTERNAL" | "PARTY_EXPANSION" | "PARTY_HYBRID"
  required_commitment: "CASUAL" | "MODERATE" | "SERIOUS" | "PROFESSIONAL"
  location_type: "REMOTE" | "IN_PERSON" | "HYBRID"
  location_detail?: string
  estimated_duration?: string
  deadline?: string
  starts_at?: string
  assigned_member_ids?: string[]
  internal_slots?: number
  party_size_min?: number
  party_size_max?: number
  public_slots?: number
  auto_approve?: boolean
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE"
}

interface QuestPublicizeData {
  public_slots: number
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE"
}

interface QuestAssignmentData {
  user_ids: string[]
  assignment_reason?: string
}

export function usePartyQuests({ partyId, questType }: UsePartyQuestsOptions) {
  return useQuery({
    queryKey: ["party-quests", partyId, questType],
    queryFn: async () => {
      const response = await PartiesService.getPartyQuests({
        partyId,
        questType,
      })
      return response
    },
    enabled: !!partyId,
  })
}

export function useCreatePartyQuest(partyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questData: PartyQuestCreateData) => {
      return await PartiesService.createPartyQuest({
        partyId,
        requestBody: questData,
      })
    },
    onSuccess: (data) => {
      toast.success("Quest created successfully!", {
        description: `${data.title} has been created for your party.`,
      })

      // Invalidate and refetch party quests
      queryClient.invalidateQueries({ queryKey: ["party-quests", partyId] })

      // Also invalidate specific quest type queries
      queryClient.invalidateQueries({
        queryKey: ["party-quests", partyId, data.quest_type]
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to create party quest:", error)
      const userFriendlyMessage = parseApiError(error)

      toast.error("Failed to create quest", {
        description: userFriendlyMessage,
      })
    },
  })
}

export function usePublicizeQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      questId,
      data
    }: {
      questId: string
      data: QuestPublicizeData
    }) => {
      return await QuestsService.publicizeQuest({
        questId,
        requestBody: data,
      })
    },
    onSuccess: (data) => {
      toast.success("Quest publicized successfully!", {
        description: `${data.title} is now visible to external applicants.`,
      })

      // Invalidate quest-related queries
      queryClient.invalidateQueries({ queryKey: ["quest", data.id] })
      queryClient.invalidateQueries({ queryKey: ["quests"] })

      // Invalidate party quests for the parent party
      if (data.parent_party_id) {
        queryClient.invalidateQueries({
          queryKey: ["party-quests", data.parent_party_id]
        })
      }
    },
    onError: (error: unknown) => {
      console.error("Failed to publicize quest:", error)
      const userFriendlyMessage = parseApiError(error)

      toast.error("Failed to publicize quest", {
        description: userFriendlyMessage,
      })
    },
  })
}

export function useAssignQuestMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      questId,
      data
    }: {
      questId: string
      data: QuestAssignmentData
    }) => {
      return await QuestsService.assignQuestMembers({
        questId,
        requestBody: data,
      })
    },
    onSuccess: (data) => {
      toast.success("Members assigned successfully!", {
        description: `Quest assignments have been updated.`,
      })

      // Invalidate quest-related queries
      queryClient.invalidateQueries({ queryKey: ["quest", data.id] })

      // Invalidate party quests for the parent party
      if (data.parent_party_id) {
        queryClient.invalidateQueries({
          queryKey: ["party-quests", data.parent_party_id]
        })
      }
    },
    onError: (error: unknown) => {
      console.error("Failed to assign quest members:", error)
      const userFriendlyMessage = parseApiError(error)

      toast.error("Failed to assign members", {
        description: userFriendlyMessage,
      })
    },
  })
}

export function useCompleteQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questId: string) => {
      return await QuestsService.completeQuest({ questId })
    },
    onSuccess: (data) => {
      toast.success("Quest completed!", {
        description: `${data.title} has been marked as completed.`,
      })

      // Invalidate quest-related queries
      queryClient.invalidateQueries({ queryKey: ["quest", data.id] })

      // Invalidate party quests for the parent party
      if (data.parent_party_id) {
        queryClient.invalidateQueries({
          queryKey: ["party-quests", data.parent_party_id]
        })
      }
    },
    onError: (error: unknown) => {
      console.error("Failed to complete quest:", error)
      const userFriendlyMessage = parseApiError(error)

      toast.error("Failed to complete quest", {
        description: userFriendlyMessage,
      })
    },
  })
}

export function useCancelQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questId: string) => {
      return await QuestsService.cancelQuest({ questId })
    },
    onSuccess: (data) => {
      toast.success("Quest cancelled", {
        description: `${data.title} has been cancelled.`,
      })

      // Invalidate quest-related queries
      queryClient.invalidateQueries({ queryKey: ["quest", data.id] })

      // Invalidate party quests for the parent party
      if (data.parent_party_id) {
        queryClient.invalidateQueries({
          queryKey: ["party-quests", data.parent_party_id]
        })
      }
    },
    onError: (error: unknown) => {
      console.error("Failed to cancel quest:", error)
      const userFriendlyMessage = parseApiError(error)

      toast.error("Failed to cancel quest", {
        description: userFriendlyMessage,
      })
    },
  })
}

// Hook to get separated internal and public quests
export function usePartyQuestsByType(partyId: string) {
  const { data: allQuests, isLoading, error } = usePartyQuests({ partyId })

  const internalQuests = allQuests?.filter(
    (quest: QuestPublic) => quest.quest_type === "PARTY_INTERNAL"
  ) || []

  const publicQuests = allQuests?.filter(
    (quest: QuestPublic) => quest.quest_type === "PARTY_EXPANSION" ||
    (quest.quest_type === "PARTY_HYBRID" && quest.is_publicized)
  ) || []

  const hybridQuests = allQuests?.filter(
    (quest: QuestPublic) => quest.quest_type === "PARTY_HYBRID" && !quest.is_publicized
  ) || []

  return {
    internalQuests,
    publicQuests,
    hybridQuests,
    allQuests: allQuests || [],
    isLoading,
    error,
  }
}
