import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserPlus, Users, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { QuestPublic, PartyMemberDetail } from "@/client"

const assignFormSchema = z.object({
  user_ids: z.array(z.string()).min(1, "Please select at least one member to assign"),
  assignment_reason: z.string().optional(),
})

type AssignFormData = z.infer<typeof assignFormSchema>

interface QuestAssignModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  quest: QuestPublic | null
  members: PartyMemberDetail[]
  onSubmit: (data: AssignFormData) => Promise<void>
  isLoading?: boolean
}

export function QuestAssignModal({
  isOpen,
  onOpenChange,
  quest,
  members,
  onSubmit,
  isLoading = false,
}: QuestAssignModalProps) {
  const form = useForm<AssignFormData>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: {
      user_ids: [],
      assignment_reason: "",
    },
  })

  // Filter out currently assigned members
  const availableMembers = members.filter((member) => {
    if (!quest?.assigned_member_ids) return true

    try {
      const assignedIds = JSON.parse(quest.assigned_member_ids)
      const memberId = member.user?.id || member.user_id
      return !assignedIds.includes(memberId)
    } catch {
      return true
    }
  })

  // Get currently assigned member count
  const currentAssignedCount = quest?.assigned_member_ids
    ? JSON.parse(quest.assigned_member_ids).length
    : 0

  const handleSubmit = async (data: AssignFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component via mutation
      console.error("Assignment failed:", error)
    }
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  const selectedUserIds = form.watch("user_ids")

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Members to Quest
          </DialogTitle>
          <DialogDescription>
            {quest && (
              <div className="space-y-2">
                <div>Select party members to assign to "{quest.title}"</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Currently assigned: {currentAssignedCount} members
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="user_ids"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Available Party Members
                  </FormLabel>
                  <FormDescription>
                    Select the members you want to assign to this internal quest.
                  </FormDescription>

                  {availableMembers.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>No available members to assign</div>
                        <div className="text-sm mt-1">
                          All party members are already assigned to this quest.
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-4">
                      {availableMembers.map((member) => {
                        const userId = member.user?.id || member.user_id
                        const userName = member.user?.full_name || member.user?.email || "Unknown User"
                        const userEmail = member.user?.email || ""

                        return (
                          <FormField
                            key={userId}
                            control={form.control}
                            name="user_ids"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(userId) || false}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || []
                                        if (checked) {
                                          field.onChange([...currentValue, userId])
                                        } else {
                                          field.onChange(
                                            currentValue.filter((value) => value !== userId)
                                          )
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex items-center gap-3 flex-1">
                                    <Avatar className="h-8 w-8">
                                      <div className="h-full w-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                        {userName.charAt(0).toUpperCase()}
                                      </div>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{userName}</div>
                                      {userEmail && (
                                        <div className="text-sm text-muted-foreground truncate">
                                          {userEmail}
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant={
                                      member.role === "OWNER" ? "default" :
                                      member.role === "MODERATOR" ? "secondary" : "outline"
                                    }>
                                      {member.role}
                                    </Badge>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        )
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignment_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why are you assigning these members? Include any specific instructions or context..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context for why these members are being assigned to help them understand their role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedUserIds.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-2">
                    Selected Members ({selectedUserIds.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserIds.map((userId) => {
                      const member = availableMembers.find(
                        (m) => (m.user?.id || m.user_id) === userId
                      )
                      const userName = member?.user?.full_name || member?.user?.email || "Unknown"

                      return (
                        <Badge key={userId} variant="secondary">
                          {userName}
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || selectedUserIds.length === 0}
              >
                {isLoading ? "Assigning..." : `Assign ${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
