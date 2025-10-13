import { useState } from "react"
import { Archive } from "lucide-react"
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
import type { PartyPublic } from "@/client"

interface ArchivePartyButtonProps {
  party: PartyPublic
  onArchive: () => void
}

export function ArchivePartyButton({ party, onArchive }: ArchivePartyButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleConfirmArchive = () => {
    setShowConfirmation(false)
    onArchive()
  }

  return (
    <>
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Archive className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">Archive Party</h4>
              <p className="text-sm text-muted-foreground">
                Archiving the party is <strong>irreversible</strong> and will:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Hide the party from active party lists</li>
                <li>Preserve all ratings, quests, and history</li>
                <li>Make the party read-only</li>
                <li>Keep ratings and quest data accessible</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={() => setShowConfirmation(true)}
            variant="secondary"
            className="w-full"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive Party
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Party?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to archive "{party.name}"? This action is{" "}
                <strong>irreversible</strong>.
              </p>
              <p>
                After archiving:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>The party will be hidden from active party lists</li>
                <li>All data (ratings, quests, members) will be preserved</li>
                <li>The party will become read-only</li>
                <li>Members can still view past ratings and quests</li>
              </ul>
              <p className="font-medium mt-2">
                This is typically used when a party has fully concluded and you want to
                clean up your active parties list.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive}>
              Archive Party
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
