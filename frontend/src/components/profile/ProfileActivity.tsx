import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Trophy, Target, Star, ThumbsUp, Calendar } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
  type QuestsPublic,
  type RatingsPublic,
  QuestsService,
  RatingsService,
} from "@/client"

interface ProfileActivityProps {
  userId: string
}

export default function ProfileActivity({ userId }: ProfileActivityProps) {
  // For now, we'll simulate fetching user's quest history
  // This would normally be a dedicated endpoint like getUserQuests()
  const { data: questsData, isLoading: isLoadingQuests } = useQuery<QuestsPublic>({
    queryKey: ["user-quests", userId],
    queryFn: () => QuestsService.readQuests({
      limit: 50,
    }),
  })

  // Fetch user's received ratings
  const { data: receivedRatings, isLoading: isLoadingRatings } = useQuery<RatingsPublic>({
    queryKey: ["user-received-ratings", userId],
    queryFn: () => RatingsService.readUserReceivedRatings({ userId }),
  })

  // Calculate stats
  const questStats = useMemo(() => {
    if (!questsData?.data) {
      return { completed: 0, created: 0, total: 0 }
    }

    return {
      total: questsData.data.length,
      completed: questsData.data.filter(q => q.status === "COMPLETED").length,
      created: questsData.data.filter(q => q.creator_id === userId).length,
    }
  }, [questsData, userId])

  if (isLoadingQuests || isLoadingRatings) {
    return <ProfileActivitySkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Quest Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6" />
                {questStats.completed}
              </div>
              <p className="text-sm text-muted-foreground">Quests Completed</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                <Target className="w-6 h-6" />
                {questStats.created}
              </div>
              <p className="text-sm text-muted-foreground">Quests Created</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                {questStats.total}
              </div>
              <p className="text-sm text-muted-foreground">Total Participation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Recent Ratings & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receivedRatings && receivedRatings.data.length > 0 ? (
            <div className="space-y-6">
              {receivedRatings.data.slice(0, 5).map((rating, index) => (
                <div key={rating.id}>
                  {/* Rating Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {/* Star Rating */}
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(rating.overall_rating)
                                  ? "text-yellow-500 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-lg">
                          {rating.overall_rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Would Collaborate Again Badge */}
                      {rating.would_collaborate_again && (
                        <div className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-3 h-3" />
                          <span className="text-xs font-medium">Would collaborate again</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <Badge variant="outline" className="text-xs">
                        Party #{rating.party_id.slice(-6)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(rating.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {rating.review_text && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground italic pl-4 border-l-2 border-muted leading-relaxed">
                        "{rating.review_text}"
                      </p>
                    </div>
                  )}

                  {/* Detailed Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-md">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Collaboration</p>
                      <p className="font-semibold text-sm">{rating.collaboration_rating.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Communication</p>
                      <p className="font-semibold text-sm">{rating.communication_rating.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Reliability</p>
                      <p className="font-semibold text-sm">{rating.reliability_rating.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Skill Level</p>
                      <p className="font-semibold text-sm">{rating.skill_rating.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Separator between ratings */}
                  {index < receivedRatings.data.slice(0, 5).length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}

              {/* Show more indicator */}
              {receivedRatings.data.length > 5 && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing 5 of {receivedRatings.data.length} ratings
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View all ratings in the Reputation tab
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-16 h-16 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Ratings Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete quests and collaborate with others to receive feedback and build your reputation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileActivitySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center p-4 border rounded-lg">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
