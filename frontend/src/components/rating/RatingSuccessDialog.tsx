import { CheckCircle2, Star, TrendingUp } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RatingSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partyId: string
  ratingsCount: number
}

export function RatingSuccessDialog({
  open,
  onOpenChange,
  partyId,
  ratingsCount,
}: RatingSuccessDialogProps) {
  const navigate = useNavigate()

  const handleReturnToParty = () => {
    onOpenChange(false)
    navigate({ to: "/parties/$partyId", params: { partyId } })
  }

  const handleViewProfile = () => {
    onOpenChange(false)
    navigate({ to: "/profile" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4">
            <div className="relative">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <Star className="h-8 w-8 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Ratings Submitted Successfully!
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              You've successfully rated {ratingsCount} party member{ratingsCount > 1 ? "s" : ""}.
            </p>
            <p className="flex items-center justify-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Your feedback helps build a stronger community
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ratings update member reputations immediately</li>
            <li>• Your feedback helps others find great collaborators</li>
            <li>• You can view updated profiles anytime</li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReturnToParty} className="w-full sm:w-auto">
            Return to Party
          </Button>
          <Button onClick={handleViewProfile} className="w-full sm:w-auto">
            View My Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
