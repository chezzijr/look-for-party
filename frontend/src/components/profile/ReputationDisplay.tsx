import { useQuery } from "@tanstack/react-query"
import { Star, TrendingUp, Users, Award, MessageSquare } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import {
  type RatingsPublic,
  type UserRatingSummary,
  RatingsService,
} from "@/client"

interface ReputationDisplayProps {
  userId: string
}

export default function ReputationDisplay({ userId }: ReputationDisplayProps) {
  // Fetch user's rating summary
  const { data: ratingSummary, isLoading: isLoadingSummary } = useQuery<UserRatingSummary>({
    queryKey: ["user-rating-summary", userId],
    queryFn: () => RatingsService.readUserRatingSummary({ userId }),
  })

  // Fetch user's received ratings for detailed view
  const { data: receivedRatings, isLoading: isLoadingRatings } = useQuery<RatingsPublic>({
    queryKey: ["user-received-ratings", userId],
    queryFn: () => RatingsService.readUserReceivedRatings({ userId }),
  })

  if (isLoadingSummary || isLoadingRatings) {
    return <ReputationSkeleton />
  }

  if (!ratingSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No reputation data available</p>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600"
    if (score >= 4.0) return "text-blue-600"
    if (score >= 3.5) return "text-yellow-600"
    if (score >= 3.0) return "text-orange-600"
    return "text-red-600"
  }

  const getReputationLevel = (score: number) => {
    if (score >= 4.5) return { label: "Excellent", icon: "🏆" }
    if (score >= 4.0) return { label: "Great", icon: "⭐" }
    if (score >= 3.5) return { label: "Good", icon: "👍" }
    if (score >= 3.0) return { label: "Fair", icon: "📈" }
    return { label: "New", icon: "🌱" }
  }

  const formatScore = (score: number | null) => score ? score.toFixed(1) : "N/A"

  const ratingCategories = [
    {
      key: "overall_rating",
      label: "Overall",
      icon: Star,
      score: ratingSummary.average_overall,
    },
    {
      key: "collaboration_rating",
      label: "Collaboration",
      icon: Users,
      score: ratingSummary.average_collaboration,
    },
    {
      key: "communication_rating",
      label: "Communication",
      icon: MessageSquare,
      score: ratingSummary.average_communication,
    },
    {
      key: "reliability_rating",
      label: "Reliability",
      icon: Award,
      score: ratingSummary.average_reliability,
    },
    {
      key: "skill_rating",
      label: "Skill Level",
      icon: TrendingUp,
      score: ratingSummary.average_skill,
    },
  ]

  const overallScore = ratingSummary.average_overall || 0
  const reputationLevel = getReputationLevel(overallScore)

  return (
    <div className="space-y-6">
      {/* Overall Reputation Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
            {reputationLevel.icon}
          </div>
          <CardTitle className="text-2xl">
            <span className={`${getScoreColor(overallScore)} font-bold`}>
              {formatScore(overallScore)}
            </span>
            <span className="text-muted-foreground text-lg ml-2">/ 5.0</span>
          </CardTitle>
          <Badge variant="secondary" className="mx-auto">
            {reputationLevel.label} Reputation
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {ratingSummary.total_ratings}
              </p>
              <p className="text-sm text-muted-foreground">Total Ratings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                0
              </p>
              <p className="text-sm text-muted-foreground">Rated Quests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ratingCategories.map((category) => {
              const score = category.score || 0
              const IconComponent = category.icon
              const progressValue = (score / 5) * 100

              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {formatScore(score)}
                    </span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      {receivedRatings && receivedRatings.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receivedRatings.data.slice(0, 5).map((rating) => (
                <div key={rating.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (rating.overall_rating || 0)
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Quest #{rating.party_id?.slice(-6)}
                    </Badge>
                  </div>

                  {rating.review_text && (
                    <p className="text-sm text-muted-foreground italic pl-4 border-l-2 border-muted">
                      "{rating.review_text}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {rating.collaboration_rating && (
                      <div className="flex justify-between">
                        <span>Collaboration:</span>
                        <span className="font-medium">{rating.collaboration_rating}</span>
                      </div>
                    )}
                    {rating.communication_rating && (
                      <div className="flex justify-between">
                        <span>Communication:</span>
                        <span className="font-medium">{rating.communication_rating}</span>
                      </div>
                    )}
                    {rating.reliability_rating && (
                      <div className="flex justify-between">
                        <span>Reliability:</span>
                        <span className="font-medium">{rating.reliability_rating}</span>
                      </div>
                    )}
                    {rating.skill_rating && (
                      <div className="flex justify-between">
                        <span>Skill:</span>
                        <span className="font-medium">{rating.skill_rating}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="mt-4" />
                </div>
              ))}

              {receivedRatings.data.length > 5 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing 5 of {receivedRatings.data.length} ratings
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements/Badges - Future Enhancement */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ratingSummary.total_ratings >= 5 && (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="text-2xl">🎖️</div>
                <div>
                  <p className="font-medium text-sm">Experienced</p>
                  <p className="text-xs text-muted-foreground">5+ rated quests</p>
                </div>
              </div>
            )}

            {(ratingSummary.average_overall || 0) >= 4.5 && (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="text-2xl">⭐</div>
                <div>
                  <p className="font-medium text-sm">Top Performer</p>
                  <p className="text-xs text-muted-foreground">4.5+ rating</p>
                </div>
              </div>
            )}

            {ratingSummary.total_ratings >= 10 && (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="text-2xl">👥</div>
                <div>
                  <p className="font-medium text-sm">Team Player</p>
                  <p className="text-xs text-muted-foreground">10+ ratings</p>
                </div>
              </div>
            )}

            {((ratingSummary.average_reliability || 0) >= 4.5) && (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="text-2xl">🛡️</div>
                <div>
                  <p className="font-medium text-sm">Reliable</p>
                  <p className="text-xs text-muted-foreground">4.5+ reliability</p>
                </div>
              </div>
            )}

            {((ratingSummary.average_communication || 0) >= 4.5) && (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="text-2xl">💬</div>
                <div>
                  <p className="font-medium text-sm">Great Communicator</p>
                  <p className="text-xs text-muted-foreground">4.5+ communication</p>
                </div>
              </div>
            )}
          </div>

          {ratingSummary.total_ratings === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Complete your first quest to start earning achievements!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReputationSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-1 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
