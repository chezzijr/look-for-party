import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { PartyCompletionWarningDialog } from "./PartyCompletionWarningDialog"
import type { PartyPublic, QuestPublic } from "@/client"

interface CompletePartyButtonProps {
  party: PartyPublic
  incompleteQuests: QuestPublic[]
  hasIncompleteQuests: boolean
  onComplete: () => void
}

export function CompletePartyButton({
  party,
  incompleteQuests,
  hasIncompleteQuests,
  onComplete,
}: CompletePartyButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false)

  const handleCompleteClick = () => {
    if (hasIncompleteQuests) {
      // Show incomplete quests warning first
      setShowIncompleteWarning(true)
    } else {
      // Show simple confirmation
      setShowConfirmation(true)
    }
  }

  const handleConfirmComplete = () => {
    setShowConfirmation(false)
    onComplete()
  }

  const handleProceedWithIncomplete = () => {
    setShowIncompleteWarning(false)
    onComplete()
  }

  return (
    <>
      <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">Complete Party</h4>
              <p className="text-sm text-muted-foreground">
                Completing the party is <strong>irreversible</strong> and will:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Enable rating for all party members</li>
                <li>Disable creation of new quests</li>
                <li>Change party status to COMPLETED permanently</li>
              </ul>
              {hasIncompleteQuests && (
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mt-2">
                  ⚠️ Warning: {incompleteQuests.length} quest
                  {incompleteQuests.length > 1 ? "s are" : " is"} still active
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleCompleteClick}
            variant="default"
            className="w-full"
          >
            Complete Party
          </Button>
        </CardContent>
      </Card>

      {/* Simple Confirmation Dialog (no incomplete quests) */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Party?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to complete "{party.name}"? This action is{" "}
                <strong>irreversible</strong>.
              </p>
              <p>
                After completion:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>All members can rate each other</li>
                <li>No new quests can be created</li>
                <li>Party cannot be changed back to ACTIVE</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Complete Party
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Incomplete Quests Warning Dialog */}
      <PartyCompletionWarningDialog
        open={showIncompleteWarning}
        onOpenChange={setShowIncompleteWarning}
        incompleteQuests={incompleteQuests}
        onProceedAnyway={handleProceedWithIncomplete}
      />
    </>
  )
}
