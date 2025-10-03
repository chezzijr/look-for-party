import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Trophy, Target, Star } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  type QuestsPublic,
  QuestsService,
} from "@/client"

interface ProfileActivityProps {
  userId: string
}

export default function ProfileActivity({ userId }: ProfileActivityProps) {
  // For now, we'll simulate fetching user's quest history
  // This would normally be a dedicated endpoint like getUserQuests()
  const { data: questsData, isLoading } = useQuery<QuestsPublic>({
    queryKey: ["user-quests", userId],
    queryFn: () => QuestsService.readQuests({
      limit: 50,
    }),
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

  if (isLoading) {
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

      {/* Ratings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Ratings & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-16 h-16 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ratings and reviews from other users will be displayed here. This will help showcase your collaboration quality and reliability.
            </p>
          </div>
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
