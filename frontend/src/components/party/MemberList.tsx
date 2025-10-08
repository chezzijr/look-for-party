import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Crown,
  Shield,
  User,
  MoreVertical,
  UserCheck,
  UserX,
  UserCog,
  MessageCircle
} from "lucide-react"
import { usePartyMembers } from "@/hooks/usePartyMembers"
import { formatDate } from "@/utils/formatters"
import type { PartyPublic, PartyMemberDetail } from "@/client"

interface MemberListProps {
  partyId: string
  party: PartyPublic
}

interface MemberCardProps {
  member: PartyMemberDetail
  canManage: boolean
  onRoleChange?: (memberId: string, newRole: string) => void
  onRemoveMember?: (memberId: string) => void
}

function MemberCard({ member, canManage, onRoleChange, onRemoveMember }: MemberCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "MODERATOR":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default"
      case "MODERATOR":
        return "secondary"
      default:
        return "outline"
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {/* TODO: avatar */}
              <AvatarImage src={undefined} />
              <AvatarFallback>{getUserInitials(member.user)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
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
              <p className="text-sm text-muted-foreground">
                Joined {formatDate(member.joined_at)}
              </p>
            </div>
          </div>

          {canManage && member.role !== "OWNER" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {/* TODO: Navigate to user profile */}}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Separator />
                  {member.role === "MEMBER" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => onRoleChange?.(member.id, "MODERATOR")}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Make Moderator
                    </Button>
                  )}
                  {member.role === "MODERATOR" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => onRoleChange?.(member.id, "MEMBER")}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Remove Moderator
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => onRemoveMember?.(member.id)}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Remove Member
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function MemberList({ partyId }: MemberListProps) {
  const { data: membersData, isLoading } = usePartyMembers(partyId)

  const handleRoleChange = (memberId: string, newRole: string) => {
    // TODO: Implement role change mutation
    console.log("Change role:", memberId, newRole)
  }

  const handleRemoveMember = (memberId: string) => {
    // TODO: Implement remove member mutation
    console.log("Remove member:", memberId)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading members...</div>
        </CardContent>
      </Card>
    )
  }

  const members = membersData?.data || []
  const memberCount = membersData?.count || 0
  const canManage = true // TODO: Check if current user is owner or moderator

  return (
    <div className="space-y-6">
      {/* Members Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Party Members ({memberCount})
          </CardTitle>
          <CardDescription>
            Manage your party members and their roles. Owners can manage all members,
            moderators can manage regular members.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Members List */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No members found.
              </div>
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              canManage={canManage}
              onRoleChange={handleRoleChange}
              onRemoveMember={handleRemoveMember}
            />
          ))
        )}
      </div>
    </div>
  )
}
