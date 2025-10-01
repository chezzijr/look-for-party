import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { type UserPublic, type UserUpdateMe, UsersService, type ApiError } from "@/client"
import { handleError } from "@/utils"
import useCustomToast from "@/hooks/useCustomToast"

interface ProfileInfoProps {
  user: UserPublic
  isOwnProfile: boolean
  isEditing: boolean
  setIsEditing: (value: boolean) => void
}

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  bio: z.string().max(1000, "Bio is too long").optional(),
  location: z.string().max(255, "Location is too long").optional(),
  timezone: z.string().max(50, "Timezone is too long").optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileInfo({ user, isOwnProfile, isEditing, setIsEditing }: ProfileInfoProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name || "",
      bio: user.bio || "",
      location: user.location || "",
      timezone: user.timezone || "",
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: UserUpdateMe) => UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Profile updated successfully")
      setIsEditing(false)
      // Invalidate both currentUser (auth context) and user-profile queries
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
    },
    onError: (error: ApiError) => {
      handleError(error)
    },
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.reset()
  }

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          {isOwnProfile && !isEditing && (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tell others about yourself..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City, Country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="UTC+0, EST, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user.full_name || "Not provided"}</p>
              </div>

              {user.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="text-sm leading-relaxed">{user.bio}</p>
                </div>
              )}

              {user.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm">{user.location}</p>
                </div>
              )}

              {user.timezone && (
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="text-sm">{user.timezone}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Reputation Score</span>
              <span className="font-semibold text-lg">
                {Number(user.reputation_score).toFixed(1)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Quests Completed</span>
              <span className="font-semibold text-lg">
                {user.total_completed_quests}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
