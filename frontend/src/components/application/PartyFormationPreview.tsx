import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  User,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { UsersService, TagsService } from "@/client"
import type { QuestPublic, QuestApplicationPublic, UserPublic, UserTagsPublic } from "@/client"
import { getProficiencyColor } from "@/utils/skillMatchingUtils"

interface PartyFormationPreviewProps {
  quest: QuestPublic
  approvedApplications: QuestApplicationPublic[]
}

interface PartyMemberPreview {
  user: UserPublic
  tags: UserTagsPublic
  isCreator: boolean
}

export function PartyFormationPreview({
  quest,
  approvedApplications,
}: PartyFormationPreviewProps) {
  // Fetch quest creator
  const { data: creator } = useQuery<UserPublic>({
    queryKey: ["user", quest.creator_id],
    queryFn: () => UsersService.readUserById({ userId: quest.creator_id }),
  })

  const { data: creatorTags } = useQuery<UserTagsPublic>({
    queryKey: ["user-tags", quest.creator_id],
    queryFn: () => TagsService.readUserTags({ userId: quest.creator_id }),
  })

  // Fetch approved applicants
  const approvedApplicantIds = approvedApplications.map((app) => app.applicant_id)

  const { data: applicantsData } = useQuery<UserPublic[]>({
    queryKey: ["approved-applicants", approvedApplicantIds],
    queryFn: async () => {
      const promises = approvedApplicantIds.map((id) =>
        UsersService.readUserById({ userId: id })
      )
      return Promise.all(promises)
    },
    enabled: approvedApplicantIds.length > 0,
  })

  const { data: applicantsTagsData } = useQuery<UserTagsPublic[]>({
    queryKey: ["approved-applicants-tags", approvedApplicantIds],
    queryFn: async () => {
      const promises = approvedApplicantIds.map((id) =>
        TagsService.readUserTags({ userId: id })
      )
      return Promise.all(promises)
    },
    enabled: approvedApplicantIds.length > 0,
  })

  const partyMembers: PartyMemberPreview[] = useMemo(() => {
    const members: PartyMemberPreview[] = []

    // Add creator
    if (creator && creatorTags) {
      members.push({ user: creator, tags: creatorTags, isCreator: true })
    }

    // Add approved applicants
    if (applicantsData && applicantsTagsData) {
      applicantsData.forEach((user, index) => {
        members.push({
          user,
          tags: applicantsTagsData[index],
          isCreator: false,
        })
      })
    }

    return members
  }, [creator, creatorTags, applicantsData, applicantsTagsData])

  // Calculate combined skills
  const combinedSkills = useMemo(() => {
    const skillMap = new Map<
      string,
      { name: string; count: number; maxProficiency: string }
    >()

    for (const member of partyMembers) {
      for (const userTag of member.tags.data) {
        const existing = skillMap.get(userTag.tag_id)
        const proficiency = userTag.proficiency_level || "BEGINNER"

        if (!existing) {
          skillMap.set(userTag.tag_id, {
            name: userTag.tag.name,
            count: 1,
            maxProficiency: proficiency,
          })
        } else {
          existing.count += 1
          // Update max proficiency if higher
          const profLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
          const currentLevel = profLevels.indexOf(existing.maxProficiency)
          const newLevel = profLevels.indexOf(proficiency)
          if (newLevel > currentLevel) {
            existing.maxProficiency = proficiency
          }
        }
      }
    }

    return Array.from(skillMap.values()).sort((a, b) => b.count - a.count)
  }, [partyMembers])

  const currentPartySize = partyMembers.length
  const minSize = quest.party_size_min
  const maxSize = quest.party_size_max
  const isReadyToClose = currentPartySize >= minSize

  const sizeProgress = (currentPartySize / maxSize) * 100

  const getInitials = (user: UserPublic) => {
    return (
      user.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || user.email[0].toUpperCase()
    )
  }

  return (
    <div className="space-y-6">
      {/* Party Size Status */}
      <Card className={isReadyToClose ? "border-green-500 border-2" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Party Formation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {currentPartySize} / {minSize}-{maxSize}
              </div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            {isReadyToClose ? (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Ready to Close
              </Badge>
            ) : (
              <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                <AlertCircle className="h-4 w-4 mr-1" />
                Need {minSize - currentPartySize} more
              </Badge>
            )}
          </div>
          <Progress value={sizeProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {isReadyToClose
              ? "Minimum party size reached. Quest can be closed to form party."
              : `Approve at least ${minSize - currentPartySize} more applicant${minSize - currentPartySize > 1 ? "s" : ""} to meet minimum requirements.`}
          </div>
        </CardContent>
      </Card>

      {/* Party Members Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Party Members ({currentPartySize})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {partyMembers.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(member.user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {member.user.full_name || member.user.email}
                    {member.isCreator && (
                      <Badge variant="secondary" className="text-xs">
                        Quest Creator
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.tags.data.length} skill{member.tags.data.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  {Number.parseFloat(member.user.reputation_score).toFixed(1)} ⭐
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Combined Skills Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Combined Skills Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>
                Party collectively has {combinedSkills.length} unique skill
                {combinedSkills.length !== 1 ? "s" : ""}
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {combinedSkills.slice(0, 12).map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <Badge
                    className={getProficiencyColor(
                      skill.maxProficiency as any
                    )}
                    variant="outline"
                  >
                    {skill.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    {skill.count} member{skill.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>

            {combinedSkills.length > 12 && (
              <div className="text-sm text-muted-foreground text-center">
                +{combinedSkills.length - 12} more skills
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Composition Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team Composition Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Members:</span>
            <span className="font-medium">{currentPartySize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Reputation:</span>
            <span className="font-medium">
              {partyMembers.length > 0
                ? (
                    partyMembers.reduce(
                      (sum, m) => sum + Number.parseFloat(m.user.reputation_score),
                      0
                    ) / partyMembers.length
                  ).toFixed(1)
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Completed Quests:</span>
            <span className="font-medium">
              {partyMembers.reduce((sum, m) => sum + m.user.total_completed_quests, 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unique Skills:</span>
            <span className="font-medium">{combinedSkills.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
