import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  QuestMembersService,
  type QuestMemberPublic,
  type QuestMemberUpdate,
  type ApiError,
} from "@/client"

// Query key factory
export const questMemberKeys = {
  all: ["quest-members"] as const,
  lists: () => [...questMemberKeys.all, "list"] as const,
  list: (questId: string) => [...questMemberKeys.lists(), questId] as const,
  details: () => [...questMemberKeys.all, "detail"] as const,
  detail: (questId: string) => [...questMemberKeys.details(), questId] as const,
  counts: () => [...questMemberKeys.all, "count"] as const,
  count: (questId: string) => [...questMemberKeys.counts(), questId] as const,
}

// Hook to get quest members for a quest
export function useQuestMembers(questId: string) {
  return useQuery({
    queryKey: questMemberKeys.list(questId),
    queryFn: () => QuestMembersService.readQuestMembers({ questId }),
    enabled: !!questId,
  })
}

// Hook to get detailed quest members (with user info)
export function useQuestMembersDetailed(questId: string) {
  return useQuery({
    queryKey: questMemberKeys.detail(questId),
    queryFn: () => QuestMembersService.readQuestMembersDetailed({ questId }),
    enabled: !!questId,
  })
}

// Hook to get quest member count only
export function useQuestMemberCount(questId: string) {
  return useQuery({
    queryKey: questMemberKeys.count(questId),
    queryFn: () => QuestMembersService.getQuestMembersCount({ questId }),
    enabled: !!questId,
    staleTime: 1000 * 60 * 5, // 5 minutes - counts change less frequently
  })
}

// Hook to update quest member status
export function useUpdateQuestMemberStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      ...updateData
    }: {
      memberId: string
    } & QuestMemberUpdate) =>
      QuestMembersService.updateQuestMemberStatus({
        memberId,
        requestBody: updateData,
      }),
    onSuccess: (_: QuestMemberPublic) => {
      // Invalidate and refetch quest member queries
      queryClient.invalidateQueries({
        queryKey: questMemberKeys.all,
      })

      // Also invalidate quest queries since member count affects quest data
      queryClient.invalidateQueries({
        queryKey: ["quests"],
      })

      toast.success("Member status updated", {
        description: "Quest member status has been updated successfully.",
      })
    },
    onError: (error: ApiError) => {
      toast.error("Error updating member status", {
        description: error.message || "Failed to update quest member status",
      })
    },
  })
}

// Hook to remove quest member
export function useRemoveQuestMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId }: { memberId: string }) =>
      QuestMembersService.removeQuestMember({ memberId }),
    onSuccess: () => {
      // Invalidate and refetch quest member queries
      queryClient.invalidateQueries({
        queryKey: questMemberKeys.all,
      })

      // Also invalidate quest queries since member count affects quest data
      queryClient.invalidateQueries({
        queryKey: ["quests"],
      })

      toast.success("Member removed", {
        description: "Quest member has been removed successfully.",
      })
    },
    onError: (error: ApiError) => {
      toast.error("Error removing member", {
        description: error.message || "Failed to remove quest member",
      })
    },
  })
}
