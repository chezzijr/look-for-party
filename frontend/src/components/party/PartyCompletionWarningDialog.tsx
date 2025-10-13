import { AlertTriangle, CheckCircle, XCircle, Clock, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getQuestStatusColor } from "@/utils/formatters"
import { useCompleteQuest, useCancelQuest } from "@/hooks/usePartyQuests"
import type { QuestPublic } from "@/client"
import { useState } from "react"

interface PartyCompletionWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incompleteQuests: QuestPublic[]
  onProceedAnyway: () => void
}

export function PartyCompletionWarningDialog({
  open,
  onOpenChange,
  incompleteQuests,
  onProceedAnyway,
}: PartyCompletionWarningDialogProps) {
  const [questToComplete, setQuestToComplete] = useState<QuestPublic | null>(null)
  const [questToCancel, setQuestToCancel] = useState<QuestPublic | null>(null)

  const completeQuestMutation = useCompleteQuest()
  const cancelQuestMutation = useCancelQuest()

  const handleCompleteQuest = (quest: QuestPublic) => {
    setQuestToComplete(quest)
  }

  const handleCancelQuest = (quest: QuestPublic) => {
    setQuestToCancel(quest)
  }

  const confirmCompleteQuest = () => {
    if (questToComplete) {
      completeQuestMutation.mutate(questToComplete.id)
      setQuestToComplete(null)
    }
  }

  const confirmCancelQuest = () => {
    if (questToCancel) {
      cancelQuestMutation.mutate(questToCancel.id)
      setQuestToCancel(null)
    }
  }

  // Group quests by status
  const inProgressQuests = incompleteQuests.filter((q) => q.status === "IN_PROGRESS")
  const recruitingQuests = incompleteQuests.filter((q) => q.status === "RECRUITING")

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <DialogTitle className="text-xl">Incomplete Quests Found</DialogTitle>
                <DialogDescription>
                  {incompleteQuests.length} quest{incompleteQuests.length > 1 ? "s are" : " is"} still active
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The following quests haven't been completed or cancelled yet. You can resolve them now
              or proceed anyway.
            </p>

            <Separator />

            {/* In Progress Quests */}
            {inProgressQuests.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  In Progress ({inProgressQuests.length})
                </h4>
                {inProgressQuests.map((quest) => (
                  <QuestActionCard
                    key={quest.id}
                    quest={quest}
                    onComplete={() => handleCompleteQuest(quest)}
                    onCancel={() => handleCancelQuest(quest)}
                    isCompleting={completeQuestMutation.isPending}
                    isCancelling={cancelQuestMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Recruiting Quests */}
            {recruitingQuests.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recruiting ({recruitingQuests.length})
                </h4>
                {recruitingQuests.map((quest) => (
                  <QuestActionCard
                    key={quest.id}
                    quest={quest}
                    onComplete={() => handleCompleteQuest(quest)}
                    onCancel={() => handleCancelQuest(quest)}
                    isCompleting={completeQuestMutation.isPending}
                    isCancelling={cancelQuestMutation.isPending}
                  />
                ))}
              </div>
            )}

            <Separator />

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Completing the party will enable member rating but won't affect
                these quests. They can still be managed independently.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Keep Party Active
            </Button>
            <Button
              onClick={onProceedAnyway}
              className="w-full sm:w-auto"
            >
              Complete Party Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!questToComplete} onOpenChange={() => setQuestToComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Quest?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark "{questToComplete?.title}" as completed? This will close the quest and notify all members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCompleteQuest}>
              Complete Quest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!questToCancel} onOpenChange={() => setQuestToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Quest?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel "{questToCancel?.title}"? This action will close the quest and notify members that it was cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelQuest} className="bg-destructive">
              Cancel Quest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface QuestActionCardProps {
  quest: QuestPublic
  onComplete: () => void
  onCancel: () => void
  isCompleting?: boolean
  isCancelling?: boolean
}

function QuestActionCard({
  quest,
  onComplete,
  onCancel,
  isCompleting,
  isCancelling,
}: QuestActionCardProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getQuestStatusColor(quest.status)}>
                {quest.status}
              </Badge>
              <h5 className="font-medium truncate">{quest.title}</h5>
            </div>
            {quest.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {quest.description}
              </p>
            )}
            {quest.quest_members_count !== undefined && quest.quest_members_count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {quest.quest_members_count} member{quest.quest_members_count > 1 ? "s" : ""} assigned
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onComplete}
            disabled={isCompleting || isCancelling}
            className="flex-1 gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isCompleting || isCancelling}
            className="flex-1 gap-1"
          >
            <XCircle className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
