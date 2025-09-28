import { useState } from "react"
import { CheckCircle, Users, AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { QuestPublic } from "@/client"

interface QuestCloseDialogProps {
  quest: QuestPublic
  approvedApplicationsCount: number
  onClose: () => void
  isLoading: boolean
  children: React.ReactNode
}

export function QuestCloseDialog({
  quest,
  approvedApplicationsCount,
  onClose,
  isLoading,
  children
}: QuestCloseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const totalPartySize = approvedApplicationsCount + 1 // +1 for creator
  const meetsMinimum = totalPartySize >= quest.party_size_min
  const isWithinRange = totalPartySize <= quest.party_size_max
  const canClose = meetsMinimum && isWithinRange

  const handleClose = () => {
    onClose()
    setIsOpen(false)
  }

  const getPartyFormationMessage = () => {
    if (quest.quest_type === "INDIVIDUAL") {
      return "A new party will be created with you as the owner and all approved applicants as members."
    } else if (quest.quest_type === "PARTY_EXPANSION") {
      return "Approved applicants will be added to your existing party as new members."
    } else if (quest.quest_type === "PARTY_INTERNAL") {
      return "The internal quest will be marked as completed."
    }
    return "The quest will be closed and processed according to its type."
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Close Quest
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to close this quest? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Party Size:</span>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{totalPartySize}</span>
                  <span className="text-muted-foreground">
                    / {quest.party_size_min}-{quest.party_size_max}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Approved Applications:</span>
                <div className="mt-1">
                  <Badge variant="secondary">{approvedApplicationsCount}</Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Requirements Check */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Requirements</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {meetsMinimum ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  Minimum party size ({quest.party_size_min} members)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isWithinRange ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  Within maximum size ({quest.party_size_max} members)
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* What Happens Next */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What happens next?</h4>
            <p className="text-sm text-muted-foreground">
              {getPartyFormationMessage()}
            </p>
            {quest.quest_type === "INDIVIDUAL" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">New Party Formation</p>
                    <p className="text-blue-700">
                      You'll be redirected to your new party dashboard where you can start coordinating with your team.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!canClose && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-900">Cannot Close Quest</p>
                  <p className="text-red-700">
                    {!meetsMinimum
                      ? `You need at least ${quest.party_size_min - totalPartySize} more approved application(s) to meet the minimum party size.`
                      : `Party size exceeds maximum limit of ${quest.party_size_max} members.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClose}
            disabled={!canClose || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Close Quest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
