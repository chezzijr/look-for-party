import { useState } from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { ArrowLeft, MapPin, Users, Clock, Calendar, User, CheckCircle, XCircle, FileText, Eye, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QuestApplicationForm } from "./QuestApplicationForm"
import { QuestCloseDialog } from "./QuestCloseDialog"
import useQuestDetail from "@/hooks/useQuestDetail"
import useAuth from "@/hooks/useAuth"
import useUserQuestApplication from "@/hooks/useUserQuestApplication"
import useQuestApplications from "@/hooks/useQuestApplications"
import useQuestClose from "@/hooks/useQuestClose"
import { getCategoryColor, getQuestStatusColor, formatDate, getApplicationStatusColor, formatApplicationStatus } from "@/utils/formatters"
import { QuestApplicationsService, type QuestApplicationCreate } from "@/client"
import { toast } from "sonner"
import useCustomToast from "@/hooks/useCustomToast"
import { parseApiError } from "@/utils/apiErrors"

interface QuestDetailPageProps {
  questId: string
}

export function QuestDetailPage({ questId }: QuestDetailPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()
  const { user: currentUser } = useAuth()
  const { data: quest, isLoading, error } = useQuestDetail(questId)
  const { data: userApplication, isLoading: applicationLoading } = useUserQuestApplication({ questId })

  // Only fetch approved applications if user is the quest creator
  const isOwnQuest = currentUser?.id === quest?.creator_id
  const { data: approvedApplications } = useQuestApplications(
    { questId, status: "APPROVED" },
    { enabled: isOwnQuest }
  )
  const [showApplicationForm, setShowApplicationForm] = useState(false)

  // Quest closing functionality
  const { closeQuest, isClosing } = useQuestClose({
    navigateToParty: true,
  })

  // Auto-join mutation for auto-approve quests
  const autoJoinMutation = useMutation({
    mutationFn: (applicationData: QuestApplicationCreate) =>
      QuestApplicationsService.applyToQuest({ questId, requestBody: applicationData }),
    onSuccess: () => {
      toast.success("Successfully joined the quest!")
      // Refresh the application data to show the new application
      queryClient.invalidateQueries({ queryKey: ["user-quest-application", questId, currentUser?.id] })
      queryClient.invalidateQueries({ queryKey: ["my-applications"] })
    },
    onError: (error: unknown) => {
      const userFriendlyMessage = parseApiError(error)
      showErrorToast(userFriendlyMessage)
    },
  })

  const handleAutoJoin = () => {
    const applicationData: QuestApplicationCreate = {
      message: "Joined via auto-approve",
      proposed_role: undefined,
      relevant_skills: undefined,
    }
    autoJoinMutation.mutate(applicationData)
  }

  if (isLoading || applicationLoading) {
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

  const hasExistingApplication = !!userApplication
  const canApply = !isOwnQuest && !hasExistingApplication && quest.status === "RECRUITING"

  // Quest closing logic
  const approvedApplicationsCount = approvedApplications?.data?.length || 0
  const totalPartySize = approvedApplicationsCount + 1 // +1 for creator
  const canCloseQuest = isOwnQuest && quest.status === "RECRUITING" && totalPartySize >= quest.party_size_min && !isClosing

  const handleCloseQuest = () => {
    closeQuest({ questId })
  }

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
                      className={getQuestStatusColor(quest.status)}
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
                  : hasExistingApplication
                  ? "You have already applied to this quest. Check your application status below."
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <User className="h-4 w-4" />
                    <span>Quest Creator</span>
                  </div>

                  {/* Quest Status Summary for Creator */}
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Quest Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Party Size:</span>
                        <div className="font-medium">{totalPartySize} / {quest.party_size_min}-{quest.party_size_max}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Approved Applications:</span>
                        <div className="font-medium">{approvedApplicationsCount}</div>
                      </div>
                    </div>
                    {canCloseQuest && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <div className="flex items-center gap-1 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Ready to close!</span>
                        </div>
                        <p className="text-green-600 mt-1">You have enough approved applications to meet the minimum party size.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link to="/my-quests">
                        <FileText className="h-4 w-4 mr-2" />
                        Manage Applications
                      </Link>
                    </Button>

                    {quest.status === "RECRUITING" && (
                      <QuestCloseDialog
                        quest={quest}
                        approvedApplicationsCount={approvedApplicationsCount}
                        onClose={handleCloseQuest}
                        isLoading={isClosing}
                      >
                        <Button
                          variant={canCloseQuest ? "destructive" : "outline"}
                          disabled={!canCloseQuest || isClosing}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {canCloseQuest ? "Close Quest" : "Close Quest"}
                        </Button>
                      </QuestCloseDialog>
                    )}
                  </div>
                </div>
              ) : hasExistingApplication && userApplication ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Your Application Status</h4>
                      <p className="text-sm text-muted-foreground">
                        Applied on {formatDate(userApplication.applied_at)}
                      </p>
                    </div>
                    <Badge
                      className={getApplicationStatusColor(userApplication.status)}
                      variant="outline"
                    >
                      {formatApplicationStatus(userApplication.status)}
                    </Badge>
                  </div>

                  {userApplication.message && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Your Application Message:</p>
                      <p className="text-sm text-muted-foreground">{userApplication.message}</p>
                    </div>
                  )}

                  {userApplication.reviewer_feedback && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Feedback from Quest Creator:</p>
                      <p className="text-sm text-muted-foreground">{userApplication.reviewer_feedback}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/my-applications">
                        <Eye className="h-4 w-4 mr-2" />
                        View All Applications
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : canApply ? (
                quest.auto_approve ? (
                  <Button
                    onClick={handleAutoJoin}
                    size="lg"
                    disabled={autoJoinMutation.isPending}
                  >
                    {autoJoinMutation.isPending ? "Joining..." : "Join Quest"}
                  </Button>
                ) : !showApplicationForm ? (
                  <Button onClick={() => setShowApplicationForm(true)} size="lg">
                    Apply to Join Quest
                  </Button>
                ) : (
                  <QuestApplicationForm
                    questId={questId}
                    onSuccess={() => {
                      setShowApplicationForm(false)
                      // Refresh the application data to show the new application
                      queryClient.invalidateQueries({ queryKey: ["user-quest-application", questId, currentUser?.id] })
                      queryClient.invalidateQueries({ queryKey: ["my-applications"] })
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
