import { Star, AlertCircle } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { useRatableUsers } from "@/hooks/useRatableUsers"
import { useCanRateParty } from "@/hooks/useCanRateParty"

interface RatingCTAProps {
  partyId: string
}

export function RatingCTA({ partyId }: RatingCTAProps) {
  const navigate = useNavigate()
  const { data: canRate, isLoading: canRateLoading } = useCanRateParty(partyId)
  const { data: ratableUsers, isLoading: usersLoading } = useRatableUsers(partyId)

  // Don't show CTA if user cannot rate or if loading
  if (canRateLoading || usersLoading || !canRate) {
    return null
  }

  // Don't show if no users to rate
  if (!ratableUsers || ratableUsers.length === 0) {
    return null
  }

  const handleRateClick = () => {
    navigate({ to: "/parties/$partyId/rate", params: { partyId } })
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <CardTitle>Rate Your Party Members</CardTitle>
        </div>
        <CardDescription className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          This party has been completed. Share your feedback to help build trust in the community.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {ratableUsers.length} member{ratableUsers.length > 1 ? "s" : ""} to rate
          </Badge>
          <p className="text-sm text-muted-foreground">
            Your feedback helps others find great collaborators
          </p>
        </div>
        <Button onClick={handleRateClick} className="gap-2">
          <Star className="h-4 w-4" />
          Rate Members
        </Button>
      </CardContent>
    </Card>
  )
}
