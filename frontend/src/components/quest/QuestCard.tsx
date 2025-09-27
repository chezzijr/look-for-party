import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Clock, Calendar } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import type { QuestPublic } from "@/client"

interface QuestCardProps {
  quest: QuestPublic
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "GAMING":
      return "bg-purple-100 text-purple-800"
    case "PROFESSIONAL":
      return "bg-blue-100 text-blue-800"
    case "SOCIAL":
      return "bg-green-100 text-green-800"
    case "LEARNING":
      return "bg-yellow-100 text-yellow-800"
    case "CREATIVE":
      return "bg-pink-100 text-pink-800"
    case "FITNESS":
      return "bg-orange-100 text-orange-800"
    case "TRAVEL":
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "RECRUITING":
      return "bg-green-100 text-green-800"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800"
    case "COMPLETED":
      return "bg-gray-100 text-gray-800"
    case "CANCELLED":
      return "bg-red-100 text-red-800"
    case "EXPIRED":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString()
}

export function QuestCard({ quest }: QuestCardProps) {
  const navigate = useNavigate()

  const handleViewDetails = () => {
    navigate({
      to: "/quests/$questId",
      params: { questId: quest.id }
    })
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {quest.title}
            </CardTitle>
            <div className="flex gap-2 mb-2">
              <Badge
                variant="secondary"
                className={getCategoryColor(quest.category)}
              >
                {quest.category}
              </Badge>
              <Badge
                variant="outline"
                className={getStatusColor(quest.status)}
              >
                {quest.status}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-3">
          {quest.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{quest.party_size_min}-{quest.party_size_max} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{quest.required_commitment}</span>
          </div>
        </div>

        {quest.location_type && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {quest.location_type === "REMOTE"
                ? "Remote"
                : quest.location_type === "IN_PERSON"
                ? quest.location_detail || "In-person"
                : "Hybrid"
              }
            </span>
          </div>
        )}

        {quest.deadline && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Deadline: {formatDate(quest.deadline)}</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
