import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle, User, MessageCircle, Clock } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import type { QuestApplicationPublic } from "@/client"
import { QuestApplicationsService } from "@/client"
import { formatDate, getApplicationStatusColor, formatApplicationStatus } from "@/utils/formatters"
import useCustomToast from "@/hooks/useCustomToast"
import { parseApiError } from "@/utils/apiErrors"

const reviewSchema = z.object({
  feedback: z.string().max(500, "Feedback must be under 500 characters").optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ApplicationReviewProps {
  application: QuestApplicationPublic
  isOpen: boolean
  onClose: () => void
}

export function ApplicationReview({
  application,
  isOpen,
  onClose
}: ApplicationReviewProps) {
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null)
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      feedback: ""
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ status, feedback }: { status: "APPROVED" | "REJECTED", feedback?: string }) =>
      QuestApplicationsService.updateApplication({
        applicationId: application.id,
        requestBody: {
          status,
          reviewer_feedback: feedback || null
        }
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quest-applications"] })
      queryClient.invalidateQueries({ queryKey: ["my-quests"] })
      toast.success(
        variables.status === "APPROVED"
          ? "Application approved successfully!"
          : "Application rejected successfully!"
      )
      handleClose()
    },
    onError: (error: unknown) => {
      const userFriendlyMessage = parseApiError(error)
      showErrorToast(userFriendlyMessage)
    },
  })

  const handleClose = () => {
    setReviewAction(null)
    reset()
    onClose()
  }

  const onSubmit = (data: ReviewFormData) => {
    if (!reviewAction) return

    updateMutation.mutate({
      status: reviewAction === "approve" ? "APPROVED" : "REJECTED",
      feedback: data.feedback
    })
  }

  const handleApprove = () => setReviewAction("approve")
  const handleReject = () => setReviewAction("reject")

  const isSubmitting = updateMutation.isPending
  const feedback = watch("feedback")

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Application</DialogTitle>
          <DialogDescription>
            Review this applicant's submission and decide whether to approve or reject their application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Application Details</CardTitle>
                <Badge
                  className={getApplicationStatusColor(application.status)}
                  variant="outline"
                >
                  {formatApplicationStatus(application.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Applied on {formatDate(application.applied_at)}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Application Message</span>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{application.message}</p>
                </div>
              </div>

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
            </CardContent>
          </Card>

          {/* Review Actions */}
          {application.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      placeholder={
                        reviewAction === "approve"
                          ? "Welcome message or additional information..."
                          : reviewAction === "reject"
                          ? "Reason for rejection or constructive feedback..."
                          : "Provide feedback for your decision..."
                      }
                      {...register("feedback")}
                      className={errors.feedback ? "border-red-500" : ""}
                      rows={3}
                    />
                    {errors.feedback && (
                      <p className="text-sm text-red-500">{errors.feedback.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {feedback?.length || 0}/500 characters
                    </p>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      variant={reviewAction === "approve" ? "default" : "outline"}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {reviewAction === "approve" ? "Confirming Approval..." : "Approve"}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      variant={reviewAction === "reject" ? "default" : "outline"}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {reviewAction === "reject" ? "Confirming Rejection..." : "Reject"}
                    </Button>
                  </div>

                  {reviewAction && (
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm font-medium mb-2">
                        You are about to {reviewAction} this application
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {reviewAction === "approve"
                          ? "The applicant will be notified and can join your quest party."
                          : "The applicant will be notified of the rejection with your feedback."}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          size="sm"
                          className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                          {isSubmitting ? "Processing..." : `Confirm ${reviewAction === "approve" ? "Approval" : "Rejection"}`}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setReviewAction(null)}
                          disabled={isSubmitting}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Already Reviewed */}
          {application.status !== "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">
                    This application was {formatApplicationStatus(application.status).toLowerCase()}
                  </p>
                  {application.reviewed_at && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Reviewed on {formatDate(application.reviewed_at)}
                    </p>
                  )}
                  {application.reviewer_feedback && (
                    <div>
                      <p className="text-sm font-medium mb-1">Feedback:</p>
                      <p className="text-sm text-muted-foreground">
                        {application.reviewer_feedback}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
