import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Clock,
  TrendingUp,
  Award,
  CheckCircle,
  Star,
  User,
  Calendar,
} from "lucide-react"

import { useApplicantProfile } from "@/hooks/useApplicantProfile"
import { formatDate } from "@/utils/formatters"
import { getReputationColor } from "@/utils/reputationUtils"
import { getProficiencyLabel, getProficiencyColor } from "@/utils/skillMatchingUtils"

interface ApplicationReviewDetailProps {
  applicantId: string
}

export function ApplicationReviewDetail({ applicantId }: ApplicationReviewDetailProps) {
  const { user, tags, ratingSummary, isLoading, isError } = useApplicantProfile(applicantId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading applicant profile...</div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Failed to load applicant profile</div>
      </div>
    )
  }

  const userTags = tags?.data || []
  const primaryTags = userTags.filter((tag) => tag.is_primary)
  const otherTags = userTags.filter((tag) => !tag.is_primary)

  // Get initials for avatar
  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email[0].toUpperCase()

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{user.full_name || "Unknown User"}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge
                  className={getReputationColor(Number.parseFloat(user.reputation_score))}
                  variant="outline"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {Number.parseFloat(user.reputation_score).toFixed(1)} Reputation
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.timezone && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{user.timezone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
              </div>

              {user.bio && (
                <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Quests Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.total_completed_quests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Reputation Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number.parseFloat(user.reputation_score).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              Active Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown */}
      {ratingSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overall</div>
                <div className="text-lg font-semibold">
                  {ratingSummary.average_overall?.toFixed(1) || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Collaboration</div>
                <div className="text-lg font-semibold">
                  {ratingSummary.average_collaboration?.toFixed(1) || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Communication</div>
                <div className="text-lg font-semibold">
                  {ratingSummary.average_communication?.toFixed(1) || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Reliability</div>
                <div className="text-lg font-semibold">
                  {ratingSummary.average_reliability?.toFixed(1) || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Skill</div>
                <div className="text-lg font-semibold">
                  {ratingSummary.average_skill?.toFixed(1) || "N/A"}
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-sm text-muted-foreground">
              Based on {ratingSummary.total_ratings || 0} rating
              {ratingSummary.total_ratings !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No skills listed yet
            </div>
          ) : (
            <div className="space-y-4">
              {primaryTags.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Primary Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {primaryTags.map((userTag) => (
                      <Badge
                        key={userTag.id}
                        className={getProficiencyColor(userTag.proficiency_level)}
                        variant="outline"
                      >
                        {userTag.tag.name} •{" "}
                        {getProficiencyLabel(userTag.proficiency_level)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {otherTags.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Additional Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {otherTags.map((userTag) => (
                      <Badge
                        key={userTag.id}
                        className={getProficiencyColor(userTag.proficiency_level)}
                        variant="outline"
                      >
                        {userTag.tag.name} •{" "}
                        {getProficiencyLabel(userTag.proficiency_level)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
