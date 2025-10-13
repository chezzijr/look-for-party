import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Shield, Trash2, AlertTriangle, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PartiesService } from "@/client"
import { toast } from "sonner"
import type { PartyPublic, PartyMemberDetail } from "@/client"
import { useIncompletePartyQuests } from "@/hooks/useIncompletePartyQuests"
import { usePartyMembers } from "@/hooks/usePartyMembers"
import { CompletePartyButton } from "./CompletePartyButton"
import { ArchivePartyButton } from "./ArchivePartyButton"
import useAuth from "@/hooks/useAuth"

interface PartySettingsProps {
  partyId: string
  party: PartyPublic
}

const partySettingsSchema = z.object({
  name: z.string().min(1, "Party name is required").max(100),
  description: z.string().max(500).optional(),
  is_private: z.boolean(),
  auto_accept_applications: z.boolean(),
})

type PartySettingsForm = z.infer<typeof partySettingsSchema>

const deletePartySchema = z.object({
  confirmText: z.string().refine((val) => val === "DELETE", {
    message: "Please type DELETE to confirm",
  }),
})

type DeletePartyForm = z.infer<typeof deletePartySchema>

export function PartySettings({ party }: PartySettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  // Get current user and party members for role checking
  const { user: currentUser } = useAuth()
  const { data: membersData } = usePartyMembers(party.id)

  // Fetch incomplete quests to validate party completion
  const { incompleteQuests, hasIncompleteQuests } = useIncompletePartyQuests(party.id)

  const form = useForm<PartySettingsForm>({
    resolver: zodResolver(partySettingsSchema),
    defaultValues: {
      name: party.name || "",
      description: party.description || "",
      is_private: false, // TODO: Get from party data
      auto_accept_applications: false, // TODO: Get from party data
    },
  })

  const deleteForm = useForm<DeletePartyForm>({
    resolver: zodResolver(deletePartySchema),
    defaultValues: {
      confirmText: "",
    },
  })

  const updatePartyMutation = useMutation({
    mutationFn: (data: PartySettingsForm) =>
      PartiesService.updateParty({
        partyId: party.id,
        requestBody: data,
      }),
    onSuccess: (updatedParty) => {
      queryClient.setQueryData(["party", party.id], updatedParty)
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast.success("Party settings updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update party settings")
      console.error("Update party settings error:", error)
    },
  })

  const deletePartyMutation = useMutation({
    mutationFn: () => {
      // TODO: Implement delete party API call
      throw new Error("Delete party not implemented yet")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast.success("Party deleted successfully")
      // TODO: Navigate back to dashboard
    },
    onError: (error) => {
      toast.error("Failed to delete party")
      console.error("Delete party error:", error)
    },
  })

  const onSettingsSubmit = (data: PartySettingsForm) => {
    updatePartyMutation.mutate(data)
  }

  // Separate mutation for completing party
  const completePartyMutation = useMutation({
    mutationFn: () =>
      PartiesService.updateParty({
        partyId: party.id,
        requestBody: { status: "COMPLETED" },
      }),
    onSuccess: () => {
      queryClient.setQueryData(["party", party.id], (old: any) => ({
        ...old,
        status: "COMPLETED",
      }))
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      queryClient.invalidateQueries({ queryKey: ["party", party.id] })
      toast.success("Party completed! Members can now rate each other.")
    },
    onError: (error) => {
      toast.error("Failed to complete party")
      console.error("Complete party error:", error)
    },
  })

  // Separate mutation for archiving party
  const archivePartyMutation = useMutation({
    mutationFn: () =>
      PartiesService.updateParty({
        partyId: party.id,
        requestBody: { status: "ARCHIVED" },
      }),
    onSuccess: () => {
      queryClient.setQueryData(["party", party.id], (old: any) => ({
        ...old,
        status: "ARCHIVED",
      }))
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      queryClient.invalidateQueries({ queryKey: ["party", party.id] })
      toast.success("Party archived successfully")
    },
    onError: (error) => {
      toast.error("Failed to archive party")
      console.error("Archive party error:", error)
    },
  })

  const handleCompleteParty = () => {
    completePartyMutation.mutate()
  }

  const handleArchiveParty = () => {
    archivePartyMutation.mutate()
  }

  const onDeleteSubmit = (_: DeletePartyForm) => {
    deletePartyMutation.mutate()
    setIsDeleting(false)
  }

  // Check if current user is the party owner
  const isOwner = membersData?.data?.some(
    (member: PartyMemberDetail) => {
      const userId = member.user?.id || member.user_id
      return userId === currentUser?.id && member.role === "OWNER"
    }
  ) || false

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium">Access Restricted</h3>
              <p className="text-sm text-muted-foreground">
                Only party owners can access settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Manage your party's basic information and visibility settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSettingsSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter party name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your party's goals and activities..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_private"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Private Party</FormLabel>
                        <FormDescription>
                          Private parties are not visible in search results and members must be invited.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_accept_applications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-accept Quest Applications</FormLabel>
                        <FormDescription>
                          Automatically accept applications for party quests without manual review.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={updatePartyMutation.isPending}
                className="w-full md:w-auto"
              >
                {updatePartyMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Party Status Management */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Party Status</CardTitle>
            <CardDescription>
              Current status: <strong>{party.status}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {party.status === "ACTIVE" && (
              <CompletePartyButton
                party={party}
                incompleteQuests={incompleteQuests}
                hasIncompleteQuests={hasIncompleteQuests}
                onComplete={handleCompleteParty}
              />
            )}

            {party.status === "COMPLETED" && (
              <ArchivePartyButton party={party} onArchive={handleArchiveParty} />
            )}

            {party.status === "ARCHIVED" && (
              <Card className="bg-muted">
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <p className="font-medium">Party is Archived</p>
                    <p className="text-sm text-muted-foreground">
                      This party is archived and read-only. All data is preserved.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Management
          </CardTitle>
          <CardDescription>
            Manage how new members can join your party.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Member Role</label>
              <Select defaultValue="MEMBER">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The default role assigned to new members who join through quests.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Party Size</label>
              <Input type="number" defaultValue="10" min="1" max="50" />
              <p className="text-xs text-muted-foreground">
                Maximum number of members allowed in this party.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that permanently affect your party.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-800">Delete Party</h4>
                <p className="text-sm text-red-600">
                  Permanently delete this party and all associated data. This action cannot be undone.
                </p>
              </div>
              <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Party
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Party</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the party
                      and remove all member associations.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...deleteForm}>
                    <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                      <FormField
                        control={deleteForm.control}
                        name="confirmText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Type <strong>DELETE</strong> to confirm:
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="DELETE" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDeleting(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={deletePartyMutation.isPending}
                        >
                          {deletePartyMutation.isPending ? "Deleting..." : "Delete Party"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
