import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Star, MessageSquare, Users as UsersIcon, Award, TrendingUp, Check } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useRatableUsers } from "@/hooks/useRatableUsers"
import { useSubmitRating } from "@/hooks/useSubmitRating"
import type { User, RatingCreate } from "@/client"

interface PostQuestRatingProps {
  partyId: string
  onSuccess?: () => void
}

const ratingSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  collaboration_rating: z.number().min(1).max(5),
  communication_rating: z.number().min(1).max(5),
  reliability_rating: z.number().min(1).max(5),
  skill_rating: z.number().min(1).max(5),
  review_text: z.string().max(1000).optional().or(z.literal("")),
  would_collaborate_again: z.boolean(),
})

type RatingFormData = z.infer<typeof ratingSchema>

export function PostQuestRating({ partyId, onSuccess }: PostQuestRatingProps) {
  const { data: ratableUsers, isLoading } = useRatableUsers(partyId)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [ratedUsers, setRatedUsers] = useState<Set<string>>(new Set())
  const submitRatingMutation = useSubmitRating()

  const form = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      overall_rating: 5,
      collaboration_rating: 5,
      communication_rating: 5,
      reliability_rating: 5,
      skill_rating: 5,
      review_text: "",
      would_collaborate_again: true,
    },
  })

  const onSubmit = async (data: RatingFormData) => {
    if (!selectedUser || !selectedUser.id) return

    const ratingData: RatingCreate = {
      party_id: partyId as string,
      rated_user_id: selectedUser.id as string,
      overall_rating: data.overall_rating,
      collaboration_rating: data.collaboration_rating,
      communication_rating: data.communication_rating,
      reliability_rating: data.reliability_rating,
      skill_rating: data.skill_rating,
      review_text: data.review_text || undefined,
      would_collaborate_again: data.would_collaborate_again,
    }

    try {
      await submitRatingMutation.mutateAsync(ratingData)
      setRatedUsers((prev) => new Set(prev).add(selectedUser.id as string))
      setSelectedUser(null)
      form.reset()

      // Check if all users have been rated
      if (ratableUsers && ratedUsers.size + 1 >= ratableUsers.length) {
        onSuccess?.()
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading ratable members...</p>
      </div>
    )
  }

  if (!ratableUsers || ratableUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Check className="h-12 w-12 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium text-lg">All Members Rated!</h3>
              <p className="text-sm text-muted-foreground">
                You've rated all party members. Thank you for your feedback!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const remainingUsers = ratableUsers.filter((user) => user.id && !ratedUsers.has(user.id))

  if (remainingUsers.length === 0 && ratableUsers.length > 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Check className="h-12 w-12 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium text-lg">All Ratings Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                You've successfully rated {ratableUsers.length} member{ratableUsers.length > 1 ? "s" : ""}.
              </p>
              {onSuccess && (
                <Button onClick={onSuccess} className="mt-4">
                  Return to Party
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ratingCategories = [
    {
      name: "overall_rating",
      label: "Overall Rating",
      icon: Star,
      description: "General satisfaction with collaboration",
    },
    {
      name: "collaboration_rating",
      label: "Collaboration",
      icon: UsersIcon,
      description: "Teamwork, cooperation, and idea sharing",
    },
    {
      name: "communication_rating",
      label: "Communication",
      icon: MessageSquare,
      description: "Responsiveness, clarity, and professionalism",
    },
    {
      name: "reliability_rating",
      label: "Reliability",
      icon: Award,
      description: "Met commitments and showed up as promised",
    },
    {
      name: "skill_rating",
      label: "Skill Level",
      icon: TrendingUp,
      description: "Technical/domain expertise demonstrated",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Member Selection */}
      {!selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Member to Rate</CardTitle>
            <CardDescription>
              {remainingUsers.length} member{remainingUsers.length > 1 ? "s" : ""} remaining to rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {remainingUsers.map((user) => (
                <Card
                  key={user.id || user.email}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {user.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Form */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    {selectedUser.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedUser.full_name || selectedUser.email}</CardTitle>
                  <CardDescription>Rate this party member</CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Rating Categories */}
                <div className="space-y-6">
                  {ratingCategories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <FormField
                        key={category.name}
                        control={form.control}
                        name={category.name as keyof RatingFormData}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>{category.label}</FormLabel>
                              </div>
                              <Badge variant="outline" className="font-mono">
                                {field.value}/5
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value as number]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {category.description}
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    )
                  })}
                </div>

                <Separator />

                {/* Written Review */}
                <FormField
                  control={form.control}
                  name="review_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Written Feedback (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your experience working with this person..."
                          className="min-h-[100px]"
                          maxLength={1000}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Would Collaborate Again */}
                <FormField
                  control={form.control}
                  name="would_collaborate_again"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I would collaborate with this person again</FormLabel>
                        <FormDescription>
                          This helps us improve future party matching
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitRatingMutation.isPending}
                >
                  {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {ratableUsers && ratableUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rating Progress</span>
              <span className="font-medium">
                {ratedUsers.size}/{ratableUsers.length} members rated
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
