import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { QuestCreationWizard } from "@/components/quest/QuestCreationWizard"
import { QuestsService } from "@/client"
import { parseApiError } from "@/utils/apiErrors"
import type { QuestCreate } from "@/client"

export const Route = createFileRoute("/_layout/quests/create")({
  component: CreateQuest,
})

function CreateQuest() {
  const navigate = useNavigate()

  const createQuestMutation = useMutation({
    mutationFn: async (questData: QuestCreate) => {
      return await QuestsService.createQuest({
        requestBody: questData,
      })
    },
    onSuccess: (data) => {
      toast.success("Quest created successfully!", {
        description: "Your quest is now live on the quest board.",
      })

      // Navigate to the quest detail page
      navigate({
        to: "/quests/$questId",
        params: { questId: data.id },
      })
    },
    onError: (error: unknown) => {
      console.error("Failed to create quest:", error)
      const userFriendlyMessage = parseApiError(error)

      toast.error("Failed to create quest", {
        description: userFriendlyMessage,
      })
    },
  })

  const handleSubmit = async (questData: QuestCreate) => {
    await createQuestMutation.mutateAsync(questData)
  }

  const handleCancel = () => {
    navigate({ to: "/quests" })
  }

  return (
    <div className="w-full">
      <div className="py-8 px-4">
        <QuestCreationWizard
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
