import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Users, Calendar, Edit2, Crown, Shield } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PartiesService } from "@/client"
import { toast } from "sonner"
import type { PartyPublic } from "@/client"
import { getPartyStatusColor, formatDate } from "@/utils/formatters"

interface PartyHeaderProps {
  party: PartyPublic
  memberCount: number
}

const partyEditSchema = z.object({
  name: z.string().min(1, "Party name is required").max(100, "Party name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

type PartyEditForm = z.infer<typeof partyEditSchema>

export function PartyHeader({ party, memberCount }: PartyHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<PartyEditForm>({
    resolver: zodResolver(partyEditSchema),
    defaultValues: {
      name: party.name || "",
      description: party.description || "",
    },
  })

  const updatePartyMutation = useMutation({
    mutationFn: (data: PartyEditForm) =>
      PartiesService.updateParty({
        partyId: party.id,
        requestBody: data,
      }),
    onSuccess: (updatedParty) => {
      queryClient.setQueryData(["party", party.id], updatedParty)
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      setIsEditing(false)
      toast.success("Party updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update party")
      console.error("Update party error:", error)
    },
  })

  const onSubmit = (data: PartyEditForm) => {
    updatePartyMutation.mutate(data)
  }

  const canEdit = true // TODO: Check if user is owner or moderator based on party member role

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">{party.name || "Unnamed Party"}</CardTitle>
              <Badge className={getPartyStatusColor(party.status || "ACTIVE")}>
                {party.status}
              </Badge>
              {canEdit && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit Party Details</DialogTitle>
                      <DialogDescription>
                        Update your party's name and description to keep members informed.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={updatePartyMutation.isPending}
                          >
                            {updatePartyMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {party.description && (
              <p className="text-muted-foreground leading-relaxed">
                {party.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Formed {formatDate(party.formed_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
