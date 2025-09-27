import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ArrowRight, MessageCircle } from "lucide-react"
import usePartyMembers from "@/hooks/usePartyMembers"
import type { PartyPublic } from "@/client"
import { getPartyStatusColor, formatDate } from "@/utils/formatters"

interface PartyCardProps {
  party: PartyPublic
  onClick?: () => void
}

export function PartyCard({ party, onClick }: PartyCardProps) {
  const { data: membersData, isLoading } = usePartyMembers(party.id)

  const memberCount = membersData?.count || 0

  const handleViewParty = (e: React.MouseEvent) => {
    e.stopPropagation()
    // For now, create a stub route that shows party info
    // TODO: Implement proper party detail page in Phase 2.1
    console.log("Navigate to party detail:", party.id)
    // navigate({ to: "/parties/$partyId", params: { partyId: party.id } })
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      handleViewParty({} as React.MouseEvent)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">
              {party.name || "Unnamed Party"}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {party.description || "No description available"}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={getPartyStatusColor(party.status || "ACTIVE")}
          >
            {party.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {isLoading ? "..." : `${memberCount} member${memberCount !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Formed {formatDate(party.formed_at)}</span>
          </div>
        </div>

        {/* Discord-style actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-2"
            onClick={handleViewParty}
          >
            <MessageCircle className="h-4 w-4" />
            View Party
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCardClick}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
