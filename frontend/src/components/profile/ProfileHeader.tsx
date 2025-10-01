import { CalendarDays, MapPin, Clock } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { type UserPublic } from "@/client"

interface ProfileHeaderProps {
  user: UserPublic
  isOwnProfile: boolean
}

export default function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getReputationColor = (score: number) => {
    if (score >= 4.5) return "text-green-600"
    if (score >= 4.0) return "text-blue-600"
    if (score >= 3.5) return "text-yellow-600"
    if (score >= 3.0) return "text-orange-600"
    return "text-red-600"
  }

  const getReputationLabel = (score: number) => {
    if (score >= 4.5) return "Excellent"
    if (score >= 4.0) return "Great"
    if (score >= 3.5) return "Good"
    if (score >= 3.0) return "Fair"
    return "New"
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-card rounded-lg border">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={""} alt={user.full_name || "User"} />
          <AvatarFallback className="text-2xl">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
        {isOwnProfile && (
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-2 -right-2 rounded-full"
            onClick={() => {}}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <h1 className="text-3xl font-bold">
            {user.full_name || "Anonymous User"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {user.email}
          </p>
        </div>

        {user.bio && (
          <p className="text-foreground max-w-2xl">
            {user.bio}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}

          {user.timezone && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{user.timezone}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4" />
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Reputation:</span>
            <span className={`font-semibold ${getReputationColor(Number(user.reputation_score))}`}>
              {Number(user.reputation_score).toFixed(1)}
            </span>
            <Badge variant="secondary" className="text-xs">
              {getReputationLabel(Number(user.reputation_score))}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Quests Completed:</span>
            <span className="font-semibold text-primary">
              {user.total_completed_quests}
            </span>
          </div>

        </div>
      </div>

      {isOwnProfile && (
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm">
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  )
}
