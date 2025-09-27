import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft, MapPin, Users, Clock, Calendar, User, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QuestApplicationForm } from "./QuestApplicationForm"
import useQuestDetail from "@/hooks/useQuestDetail"
import useAuth from "@/hooks/useAuth"

interface QuestDetailPageProps {
  questId: string
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

export function QuestDetailPage({ questId }: QuestDetailPageProps) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: quest, isLoading, error } = useQuestDetail(questId)
  const [showApplicationForm, setShowApplicationForm] = useState(false)

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="pt-12 m-4">
          <div className="text-muted-foreground">Loading quest details...</div>
        </div>
      </div>
    )
  }

  if (error || !quest) {
    return (
      <div className="w-full">
        <div className="pt-12 m-4">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/quests" })}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quests
          </Button>
          <div className="text-center py-8">
            <p className="text-red-600">Quest not found or failed to load</p>
          </div>
        </div>
      </div>
    )
  }

  const isOwnQuest = currentUser?.id === quest.creator_id
  const canApply = !isOwnQuest && quest.status === "RECRUITING"

  return (
    <div className="w-full">
      <div className="pt-12 m-4">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/quests" })}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quest Board
        </Button>

        <div className="space-y-6">
          {/* Quest Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{quest.title}</CardTitle>
                  <div className="flex gap-2 mb-3">
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
                  <CardDescription className="text-base">
                    {quest.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Objective</h3>
                <p className="text-muted-foreground">{quest.objective}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quest Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Party Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Party Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quest.party_size_min}-{quest.party_size_max} members
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Looking for {quest.party_size_min === quest.party_size_max
                    ? `exactly ${quest.party_size_min}`
                    : `between ${quest.party_size_min} and ${quest.party_size_max}`} team members
                </p>
              </CardContent>
            </Card>

            {/* Commitment Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Commitment Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {quest.required_commitment.toLowerCase()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Expected time commitment level
                </p>
              </CardContent>
            </Card>

            {/* Location */}
            {quest.location_type && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {quest.location_type === "REMOTE"
                      ? "Remote"
                      : quest.location_type === "IN_PERSON"
                      ? "In-person"
                      : "Hybrid"
                    }
                  </div>
                  {quest.location_detail && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {quest.location_detail}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Created: </span>
                  <span className="font-medium">{formatDate(quest.created_at)}</span>
                </div>
                {quest.starts_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">Starts: </span>
                    <span className="font-medium">{formatDate(quest.starts_at)}</span>
                  </div>
                )}
                {quest.deadline && (
                  <div>
                    <span className="text-sm text-muted-foreground">Deadline: </span>
                    <span className="font-medium">{formatDate(quest.deadline)}</span>
                  </div>
                )}
                {quest.estimated_duration && (
                  <div>
                    <span className="text-sm text-muted-foreground">Duration: </span>
                    <span className="font-medium">{quest.estimated_duration}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Section */}
          <Card>
            <CardHeader>
              <CardTitle>Join This Quest</CardTitle>
              <CardDescription>
                {isOwnQuest
                  ? "This is your quest. You can manage applications and party formation."
                  : canApply
                  ? "Apply to join this quest and collaborate with other members."
                  : quest.status === "RECRUITING"
                  ? "Applications are currently being reviewed."
                  : "This quest is no longer accepting applications."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOwnQuest ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <User className="h-4 w-4" />
                  <span>Quest Creator</span>
                </div>
              ) : canApply ? (
                !showApplicationForm ? (
                  <Button onClick={() => setShowApplicationForm(true)} size="lg">
                    Apply to Join Quest
                  </Button>
                ) : (
                  <QuestApplicationForm
                    questId={questId}
                    onSuccess={() => {
                      setShowApplicationForm(false)
                      // Could add a success message here
                    }}
                    onCancel={() => setShowApplicationForm(false)}
                  />
                )
              ) : quest.status === "RECRUITING" ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span>Applications under review</span>
                </div>
              ) : quest.status === "IN_PROGRESS" ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Quest in progress</span>
                </div>
              ) : quest.status === "COMPLETED" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Quest completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Quest no longer available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
