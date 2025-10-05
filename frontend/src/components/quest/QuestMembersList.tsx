import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, UserCheck, Clock, Star } from "lucide-react"
import { useQuestMembersDetailed } from "@/hooks/useQuestMembers"
import { formatDate } from "@/utils/formatters"
import type { QuestMemberDetail } from "@/client"

interface QuestMembersListProps {
  questId: string
  canManage?: boolean
  showAssignmentReasons?: boolean
  compact?: boolean
  maxDisplay?: number
}

interface MemberCardProps {
  member: QuestMemberDetail
  showAssignmentReason: boolean
  compact: boolean
}

function MemberCard({ member, showAssignmentReason, compact }: MemberCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CREATOR":
        return <Star className="h-4 w-4 text-yellow-500" />
      case "MODERATOR":
        return <UserCheck className="h-4 w-4 text-blue-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "CREATOR":
        return "default"
      case "MODERATOR":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getJoinMethodLabel = (method: string) => {
    switch (method) {
      case "CREATOR":
        return "Quest Creator"
      case "APPLICATION":
        return "Applied"
      case "AUTO_APPROVAL":
        return "Auto-approved"
      case "INTERNAL_ASSIGNMENT":
        return "Assigned"
      default:
        return method
    }
  }

  const getUserInitials = (user: any) => {
    if (!user) return "?"
    if (user.full_name) {
      return user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.[0]?.toUpperCase() || "?"
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{getUserInitials(member.user)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {member.user?.full_name || member.user?.email || "Unknown User"}
          </p>
        </div>
        <Badge variant={getRoleBadgeVariant(member.role || "MEMBER")} className="text-xs">
          {member.role}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getUserInitials(member.user)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">
            {member.user?.full_name || member.user?.email || "Unknown User"}
          </span>
          <Badge variant={getRoleBadgeVariant(member.role || "MEMBER")} className="text-xs">
            <span className="flex items-center gap-1">
              {getRoleIcon(member.role || "MEMBER")}
              {member.role}
            </span>
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Joined {formatDate(member.joined_at)}
          </div>
          {member.join_method && (
            <div className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {getJoinMethodLabel(member.join_method)}
            </div>
          )}
        </div>
        {showAssignmentReason && member.assignment_reason && (
          <p className="mt-2 text-sm text-muted-foreground italic">
            "{member.assignment_reason}"
          </p>
        )}
      </div>
    </div>
  )
}

export function QuestMembersList({
  questId,
  canManage = false,
  showAssignmentReasons = false,
  compact = false,
  maxDisplay,
}: QuestMembersListProps) {
  const { data: membersData, isLoading } = useQuestMembersDetailed(questId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading members...</div>
      </div>
    )
  }

  const members = membersData?.data || []
  const displayMembers = maxDisplay ? members.slice(0, maxDisplay) : members
  const hiddenCount = maxDisplay && members.length > maxDisplay ? members.length - maxDisplay : 0

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">No members assigned yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {displayMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          showAssignmentReason={showAssignmentReasons && canManage}
          compact={compact}
        />
      ))}
      {hiddenCount > 0 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          and {hiddenCount} more member{hiddenCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
