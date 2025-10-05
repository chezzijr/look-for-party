import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Star,
  CheckCircle,
  TrendingUp,
  Award,
  User,
  X,
} from "lucide-react"

import { useApplicantProfile } from "@/hooks/useApplicantProfile"
import { useSkillMatch } from "@/hooks/useSkillMatch"
import type { QuestApplicationPublic } from "@/client"
import { getReputationColor } from "@/utils/reputationUtils"
import { getMatchScoreColor, getProficiencyLabel } from "@/utils/skillMatchingUtils"

interface ApplicantComparisonData {
  application: QuestApplicationPublic
  profile: ReturnType<typeof useApplicantProfile>
  skillMatch: ReturnType<typeof useSkillMatch>
}

interface ApplicationComparisonProps {
  applications: QuestApplicationPublic[]
  questId: string
  isOpen: boolean
  onClose: () => void
}

function ApplicantColumn({
  data,
  onRemove,
}: {
  data: ApplicantComparisonData
  onRemove: () => void
}) {
  const { user, tags, ratingSummary } = data.profile
  const { matchResult } = data.skillMatch

  if (!user) return null

  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email[0].toUpperCase()

  const overallScore = matchResult?.overallScore || 0
  const primaryTags = tags?.data.filter((tag) => tag.is_primary) || []

  return (
    <Card className="flex-1 min-w-[250px] relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-12 w-12 mb-2">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="font-semibold">{user.full_name || "Unknown"}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Score */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Match Score</div>
          <Badge className={`w-full justify-center ${getMatchScoreColor(overallScore)}`}>
            {overallScore}%
          </Badge>
        </div>

        <Separator />

        {/* Reputation */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Star className="h-3 w-3" />
            Reputation
          </div>
          <Badge
            className={`w-full justify-center ${getReputationColor(Number.parseFloat(user.reputation_score))}`}
            variant="outline"
          >
            {Number.parseFloat(user.reputation_score).toFixed(1)}
          </Badge>
        </div>

        {/* Quests Completed */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Quests Completed
          </div>
          <div className="text-center font-semibold">{user.total_completed_quests}</div>
        </div>

        <Separator />

        {/* Rating Breakdown */}
        {ratingSummary && (
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Ratings
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Overall:</span>
                <span className="font-medium">
                  {ratingSummary.average_overall?.toFixed(1) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Collaboration:</span>
                <span className="font-medium">
                  {ratingSummary.average_collaboration?.toFixed(1) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Communication:</span>
                <span className="font-medium">
                  {ratingSummary.average_communication?.toFixed(1) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Skill:</span>
                <span className="font-medium">
                  {ratingSummary.average_skill?.toFixed(1) || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Primary Skills */}
        <div>
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Award className="h-3 w-3" />
            Primary Skills
          </div>
          <div className="flex flex-wrap gap-1">
            {primaryTags.length > 0 ? (
              primaryTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.tag.name}
                  {tag.proficiency_level && (
                    <span className="ml-1">({getProficiencyLabel(tag.proficiency_level)[0]})</span>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">None listed</span>
            )}
          </div>
        </div>

        {/* Application Message Preview */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <User className="h-3 w-3" />
            Message
          </div>
          <div className="text-xs text-muted-foreground line-clamp-3 bg-muted p-2 rounded">
            {data.application.message}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ApplicationComparison({
  applications,
  questId,
  isOpen,
  onClose,
}: ApplicationComparisonProps) {
  const [selectedApplications, setSelectedApplications] = useState<
    QuestApplicationPublic[]
  >(applications.slice(0, 3))

  const comparisonData: ApplicantComparisonData[] = selectedApplications.map((app) => {
    const profile = useApplicantProfile(app.applicant_id)
    const skillMatch = useSkillMatch(profile.tags, questId)
    return { application: app, profile, skillMatch }
  })

  const handleRemoveApplicant = (index: number) => {
    setSelectedApplications((prev) => prev.filter((_, i) => i !== index))
  }

  const isLoading = comparisonData.some((data) => data.profile.isLoading || data.skillMatch.isLoading)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Applicants</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of applicant skills, ratings, and experience
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading comparison data...</div>
          </div>
        ) : selectedApplications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              Select at least one applicant to compare
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {comparisonData.map((data, index) => (
                <ApplicantColumn
                  key={data.application.id}
                  data={data}
                  onRemove={() => handleRemoveApplicant(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Best Candidate Indicator */}
        {selectedApplications.length > 1 && !isLoading && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-700">
                <Award className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Recommended Candidate</div>
                  <div className="text-sm">
                    {(() => {
                      const bestMatch = comparisonData.reduce((best, current) => {
                        const bestScore = best.skillMatch.matchResult?.overallScore || 0
                        const currentScore = current.skillMatch.matchResult?.overallScore || 0
                        return currentScore > bestScore ? current : best
                      })
                      return (
                        bestMatch.profile.user?.full_name ||
                        bestMatch.profile.user?.email ||
                        "Unknown"
                      )
                    })()}{" "}
                    has the highest match score
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
