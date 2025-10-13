import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PostQuestRating } from "@/components/rating/PostQuestRating"
import { RatingSuccessDialog } from "@/components/rating/RatingSuccessDialog"
import { useCanRateParty } from "@/hooks/useCanRateParty"
import { usePartyDetail } from "@/hooks/usePartyDetail"
import { useRatableUsers } from "@/hooks/useRatableUsers"

export const Route = createFileRoute("/_layout/parties/$partyId/rate")({
  component: RatePartyMembersPage,
})

function RatePartyMembersPage() {
  const { partyId } = Route.useParams()
  const navigate = useNavigate()
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const { data: party, isLoading: partyLoading } = usePartyDetail(partyId)
  const { data: canRate, isLoading: canRateLoading } = useCanRateParty(partyId)
  const { data: ratableUsers } = useRatableUsers(partyId)

  const handleSuccess = () => {
    setShowSuccessDialog(true)
  }

  const handleBackToParty = () => {
    navigate({ to: "/parties/$partyId", params: { partyId } })
  }

  if (partyLoading || canRateLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // Check if party is completed or archived
  if (party && party.status !== "COMPLETED" && party.status !== "ARCHIVED") {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Rating Not Available</h3>
                <p className="text-sm text-muted-foreground">
                  You can only rate members when the party is marked as completed or archived.
                </p>
              </div>
              <Button onClick={handleBackToParty}>Return to Party</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user can rate
  if (!canRate) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have permission to rate members in this party.
                </p>
              </div>
              <Button onClick={handleBackToParty}>Return to Party</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBackToParty}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Rate Party Members</h1>
          <p className="text-muted-foreground mt-1">
            {party?.name || "Unknown Party"} - Share your feedback
          </p>
        </div>
      </div>

      {/* Rating Component */}
      <PostQuestRating partyId={partyId} onSuccess={handleSuccess} />

      {/* Success Dialog */}
      <RatingSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        partyId={partyId}
        ratingsCount={ratableUsers?.length || 0}
      />
    </div>
  )
}
