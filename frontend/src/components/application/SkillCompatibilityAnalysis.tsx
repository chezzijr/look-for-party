import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Award,
} from "lucide-react"

import { useApplicantProfile } from "@/hooks/useApplicantProfile"
import { useSkillMatch } from "@/hooks/useSkillMatch"
import {
  getMatchScoreColor,
  getProficiencyLabel,
  getProficiencyColor,
} from "@/utils/skillMatchingUtils"

interface SkillCompatibilityAnalysisProps {
  applicantId: string
  questId: string
}

export function SkillCompatibilityAnalysis({
  applicantId,
  questId,
}: SkillCompatibilityAnalysisProps) {
  const { tags: userTagsData, isLoading: isProfileLoading } = useApplicantProfile(applicantId)
  const { matchResult, skillGaps, perfectMatches, isLoading: isMatchLoading } = useSkillMatch(
    userTagsData,
    questId
  )

  const isLoading = isProfileLoading || isMatchLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Analyzing skill compatibility...</div>
      </div>
    )
  }

  if (!matchResult) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">No skill data available</div>
      </div>
    )
  }

  const { overallScore, requiredSkillsScore, optionalSkillsScore } = matchResult

  return (
    <div className="space-y-6">
      {/* Overall Match Score */}
      <Card className={`border-2 ${getMatchScoreColor(overallScore)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Match Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold">{overallScore}%</div>
            <div className="flex-1">
              <Progress value={overallScore} className="h-4" />
              <div className="text-sm text-muted-foreground mt-2">
                {overallScore >= 75
                  ? "Excellent match! This applicant meets most requirements."
                  : overallScore >= 50
                  ? "Good match with some skill gaps to consider."
                  : "Moderate match - significant skill gaps present."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Required Skills Match */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-red-600" />
              Required Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{requiredSkillsScore}%</span>
                <Badge
                  className={getMatchScoreColor(requiredSkillsScore)}
                  variant="outline"
                >
                  {matchResult.matchedRequired.length} of{" "}
                  {matchResult.matchedRequired.length + matchResult.missingRequired.length}{" "}
                  matched
                </Badge>
              </div>
              <Progress value={requiredSkillsScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Optional Skills Match */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Optional Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{optionalSkillsScore}%</span>
                <Badge
                  className={getMatchScoreColor(optionalSkillsScore)}
                  variant="outline"
                >
                  {matchResult.matchedOptional.length} of{" "}
                  {matchResult.matchedOptional.length + matchResult.missingOptional.length}{" "}
                  matched
                </Badge>
              </div>
              <Progress value={optionalSkillsScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Perfect Matches */}
      {perfectMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Perfect Matches ({perfectMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {perfectMatches.map((match) => {
                const userTag = match.userTag
                const questTag = match.questTag
                return (
                  <Badge
                    key={match.questTag.id}
                    className="bg-green-50 text-green-700 border-green-200"
                    variant="outline"
                  >
                    {questTag.tag.name}
                    {questTag.min_proficiency && (
                      <>
                        {" "}
                        • {getProficiencyLabel(userTag.proficiency_level)}
                        {match.proficiencyMatch && " ✓"}
                      </>
                    )}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Gaps */}
      {skillGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Skill Gaps ({skillGaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Required Gaps */}
              {skillGaps.filter((gap) => gap.isRequired).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 text-red-600">
                    Missing Required Skills:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillGaps
                      .filter((gap) => gap.isRequired)
                      .map((gap) => (
                        <Badge
                          key={gap.tag.id}
                          className="bg-red-50 text-red-700 border-red-200"
                          variant="outline"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          {gap.tag.tag.name}
                          {gap.requiredProficiency && (
                            <span className="ml-1 text-xs">
                              (need {getProficiencyLabel(gap.requiredProficiency)})
                            </span>
                          )}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Optional Gaps */}
              {skillGaps.filter((gap) => !gap.isRequired).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 text-orange-600">
                    Missing Optional Skills:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillGaps
                      .filter((gap) => !gap.isRequired)
                      .map((gap) => (
                        <Badge
                          key={gap.tag.id}
                          className="bg-orange-50 text-orange-700 border-orange-200"
                          variant="outline"
                        >
                          {gap.tag.tag.name}
                          {gap.requiredProficiency && (
                            <span className="ml-1 text-xs">
                              (prefer {getProficiencyLabel(gap.requiredProficiency)})
                            </span>
                          )}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matched Skills Detail */}
      {matchResult.matchedRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Matched Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchResult.matchedRequired.map((questTag) => {
                const userTag = userTagsData?.data.find((ut) => ut.tag_id === questTag.tag_id)
                return (
                  <Badge
                    key={questTag.id}
                    className={getProficiencyColor(userTag?.proficiency_level)}
                    variant="outline"
                  >
                    {questTag.tag.name} • {getProficiencyLabel(userTag?.proficiency_level)}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {matchResult.matchedOptional.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Matched Optional Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchResult.matchedOptional.map((questTag) => {
                const userTag = userTagsData?.data.find((ut) => ut.tag_id === questTag.tag_id)
                return (
                  <Badge
                    key={questTag.id}
                    className={getProficiencyColor(userTag?.proficiency_level)}
                    variant="outline"
                  >
                    {questTag.tag.name} • {getProficiencyLabel(userTag?.proficiency_level)}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
