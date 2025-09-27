import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "@tanstack/react-router"
import { Clock, User, MessageCircle, CheckCircle, XCircle, Eye } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { QuestApplicationPublic, QuestPublic } from "@/client"
import { QuestApplicationsService } from "@/client"
import { formatDate, getApplicationStatusColor, formatApplicationStatus, getCategoryColor } from "@/utils/formatters"
import useCustomToast from "@/hooks/useCustomToast"
import { parseApiError } from "@/utils/apiErrors"

interface ApplicationCardProps {
  application: QuestApplicationPublic
  quest?: QuestPublic
  showQuestInfo?: boolean
  showActions?: boolean
  onReview?: (application: QuestApplicationPublic) => void
}

export function ApplicationCard({
  application,
  quest,
  showQuestInfo = true,
  showActions = false,
  onReview
}: ApplicationCardProps) {
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) =>
      QuestApplicationsService.withdrawApplication({ applicationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] })
      toast.success("Application withdrawn successfully")
    },
    onError: (error: unknown) => {
      const userFriendlyMessage = parseApiError(error)
      showErrorToast(userFriendlyMessage)
    },
  })

  const handleWithdraw = () => {
    if (confirm("Are you sure you want to withdraw this application?")) {
      withdrawMutation.mutate(application.id)
    }
  }

  const canWithdraw = application.status === "PENDING"
  const isWithdrawing = withdrawMutation.isPending

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {showQuestInfo && quest && (
              <div className="mb-2">
                <Link
                  to="/quests/$questId"
                  params={{ questId: quest.id }}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {quest.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={getCategoryColor(quest.category)}
                    variant="outline"
                  >
                    {quest.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {quest.party_size_min} - {quest.party_size_max} members
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge
                className={getApplicationStatusColor(application.status)}
                variant="outline"
              >
                {formatApplicationStatus(application.status)}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Applied {formatDate(application.applied_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Application Message */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Application Message</span>
          </div>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {application.message}
          </p>
        </div>

        {/* Proposed Role */}
        {application.proposed_role && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Proposed Role</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {application.proposed_role}
            </p>
          </div>
        )}

        {/* Relevant Skills */}
        {application.relevant_skills && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Relevant Skills</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {application.relevant_skills}
            </p>
          </div>
        )}

        {/* Reviewer Feedback */}
        {application.reviewer_feedback && (
          <div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Feedback</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {application.reviewer_feedback}
              </p>
              {application.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Reviewed on {formatDate(application.reviewed_at)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {showQuestInfo && quest && (
            <Button asChild variant="outline" size="sm">
              <Link to="/quests/$questId" params={{ questId: quest.id }}>
                <Eye className="h-4 w-4 mr-2" />
                View Quest
              </Link>
            </Button>
          )}

          {showActions && onReview && (
            <Button
              onClick={() => onReview(application)}
              size="sm"
              variant="outline"
            >
              Review Application
            </Button>
          )}

          {canWithdraw && !showActions && (
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
