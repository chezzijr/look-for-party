import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { QuestsService } from "@/client"
import { toast } from "sonner"
import useCustomToast from "./useCustomToast"
import { parseApiError } from "@/utils/apiErrors"

interface UseQuestCloseOptions {
  onSuccess?: (questId: string) => void
  navigateToParty?: boolean
}

export default function useQuestClose(options: UseQuestCloseOptions = {}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const closeQuestMutation = useMutation({
    mutationFn: ({ questId }: { questId: string }) =>
      QuestsService.closeQuest({ questId }),
    onMutate: async ({ questId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["quest", questId] })

      // Snapshot the previous value
      const previousQuest = queryClient.getQueryData(["quest", questId])

      // Optimistically update to the new value
      queryClient.setQueryData(["quest", questId], (old: any) => {
        if (old) {
          return { ...old, status: "IN_PROGRESS" }
        }
        return old
      })

      // Return a context object with the snapshotted value
      return { previousQuest, questId }
    },
    onError: (error, { questId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuest) {
        queryClient.setQueryData(["quest", questId], context.previousQuest)
      }

      // Show error message
      const userFriendlyMessage = parseApiError(error)
      showErrorToast(userFriendlyMessage)
    },
    onSuccess: (closedQuest) => {
      // Show success message
      if (closedQuest.quest_type === "INDIVIDUAL") {
        toast.success("Quest closed! New party has been created.", {
          description: "You can now coordinate with your team members.",
        })
      } else if (closedQuest.quest_type === "PARTY_EXPANSION") {
        toast.success("Quest closed! New members added to your party.", {
          description: "Welcome your new team members to the party.",
        })
      } else {
        toast.success("Quest closed successfully!")
      }

      // Invalidate relevant queries with proper query key patterns
      queryClient.invalidateQueries({ queryKey: ["quest", closedQuest.id] })
      queryClient.invalidateQueries({ queryKey: ["my-quests"] })
      queryClient.invalidateQueries({ queryKey: ["parties", "my-parties"] })
      queryClient.invalidateQueries({ queryKey: ["quest-applications", closedQuest.id] })
      queryClient.invalidateQueries({ queryKey: ["quest-applications"] })
      queryClient.invalidateQueries({ queryKey: ["quests"] })

      // Invalidate specific quest applications for this quest
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "quest-applications" &&
          query.queryKey[1] === closedQuest.id
      })

      // Invalidate party quests for the created/expanded party
      if (closedQuest.quest_type === "INDIVIDUAL" && closedQuest.party_id) {
        queryClient.invalidateQueries({
          queryKey: ["party-quests", closedQuest.party_id]
        })
      } else if (closedQuest.quest_type === "PARTY_EXPANSION" && closedQuest.parent_party_id) {
        queryClient.invalidateQueries({
          queryKey: ["party-quests", closedQuest.parent_party_id]
        })
      }

      // Call custom success handler
      if (options.onSuccess) {
        options.onSuccess(closedQuest.id)
      }

      // Navigate to party if requested and party was created/expanded
      if (options.navigateToParty) {
        if (closedQuest.quest_type === "INDIVIDUAL" && closedQuest.party_id) {
          // Navigate to newly created party
          navigate({
            to: "/parties/$partyId",
            params: { partyId: closedQuest.party_id },
          })
        } else if (closedQuest.quest_type === "PARTY_EXPANSION" && closedQuest.parent_party_id) {
          // Navigate to expanded party
          navigate({
            to: "/parties/$partyId",
            params: { partyId: closedQuest.parent_party_id },
          })
        } else {
          // Navigate back to quest detail page
          navigate({
            to: "/quests/$questId",
            params: { questId: closedQuest.id },
          })
        }
      }
    },
  })

  return {
    closeQuest: closeQuestMutation.mutate,
    isClosing: closeQuestMutation.isPending,
    error: closeQuestMutation.error,
  }
}
