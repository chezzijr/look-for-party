import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { type ApiError, type QuestApplicationCreate, QuestApplicationsService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { parseApiError } from "@/utils/apiErrors"

const applicationSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters").max(500, "Message must be under 500 characters"),
  proposed_role: z.string().max(100, "Role must be under 100 characters").optional(),
  relevant_skills: z.string().max(300, "Skills must be under 300 characters").optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface QuestApplicationFormProps {
  questId: string
  onSuccess: () => void
  onCancel: () => void
}

export function QuestApplicationForm({ questId, onSuccess, onCancel }: QuestApplicationFormProps) {
  const { showErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    mode: "onBlur",
  })

  const mutation = useMutation({
    mutationFn: (data: QuestApplicationCreate) =>
      QuestApplicationsService.applyToQuest({ questId, requestBody: data }),
    onSuccess: () => {
      toast.success("Application submitted successfully!")
      onSuccess()
    },
    onError: (error: unknown) => {
      const userFriendlyMessage = parseApiError(error)
      showErrorToast(userFriendlyMessage)
    },
  })

  const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
    const applicationData: QuestApplicationCreate = {
      message: data.message,
      proposed_role: data.proposed_role || undefined,
      relevant_skills: data.relevant_skills || undefined,
    }
    mutation.mutate(applicationData)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Apply to Join Quest</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tell the quest creator why you'd be a great addition to their team.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">
            Personal Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="message"
            placeholder="Explain why you're interested in this quest and what you can contribute..."
            {...register("message")}
            className={errors.message ? "border-red-500" : ""}
          />
          {errors.message && (
            <p className="text-sm text-red-500">{errors.message.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Minimum 10 characters, maximum 500 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposed_role">Proposed Role (Optional)</Label>
          <Input
            id="proposed_role"
            placeholder="e.g. Frontend Developer, Project Manager, Designer..."
            {...register("proposed_role")}
            className={errors.proposed_role ? "border-red-500" : ""}
          />
          {errors.proposed_role && (
            <p className="text-sm text-red-500">{errors.proposed_role.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            What role would you like to take in this quest?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="relevant_skills">Relevant Skills (Optional)</Label>
          <Textarea
            id="relevant_skills"
            placeholder="List your relevant skills, experience, or qualifications..."
            {...register("relevant_skills")}
            className={errors.relevant_skills ? "border-red-500" : ""}
            rows={3}
          />
          {errors.relevant_skills && (
            <p className="text-sm text-red-500">{errors.relevant_skills.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Highlight skills that make you a good fit for this quest
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
