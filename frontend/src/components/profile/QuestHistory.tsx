import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, MapPin, Users, Clock, Trophy, Target, Filter } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import {
  type QuestsPublic,
  type QuestPublic,
  QuestsService,
} from "@/client"

interface QuestHistoryProps {
  userId: string
}

type FilterType = "all" | "completed" | "created" | "category"
type QuestStatus = "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

const statusColors: Record<QuestStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  RECRUITING: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const categoryColors: Record<string, string> = {
  GAMING: "bg-purple-100 text-purple-800",
  PROFESSIONAL: "bg-blue-100 text-blue-800",
  CREATIVE: "bg-pink-100 text-pink-800",
  SOCIAL: "bg-green-100 text-green-800",
  EDUCATIONAL: "bg-indigo-100 text-indigo-800",
  HEALTH: "bg-red-100 text-red-800",
  TECHNOLOGY: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-800",
}

export default function QuestHistory({ userId }: QuestHistoryProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // For now, we'll simulate fetching user's quest history
  // This would normally be a dedicated endpoint like getUserQuests()
  const { data: questsData, isLoading } = useQuery<QuestsPublic>({
    queryKey: ["user-quests", userId, filter],
    queryFn: () => QuestsService.readQuests({
      limit: 50,
    }),
  })

  // Filter and group quests
  const { filteredQuests, questStats } = useMemo(() => {
    if (!questsData?.data) {
      return { filteredQuests: [], questStats: { completed: 0, created: 0, total: 0 } }
    }

    let filtered = questsData.data

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(quest => quest.category === selectedCategory)
    }

    // Apply status filter
    if (filter === "completed") {
      filtered = filtered.filter(quest => quest.status === "COMPLETED")
    }

    // Calculate stats
    const stats = {
      total: questsData.data.length,
      completed: questsData.data.filter(q => q.status === "COMPLETED").length,
      created: questsData.data.filter(q => q.creator_id === userId).length,
    }

    return { filteredQuests: filtered, questStats: stats }
  }, [questsData, filter, selectedCategory, userId])

  // Group quests by month for timeline view
  const questsByMonth = useMemo(() => {
    if (!filteredQuests) return {}

    return filteredQuests.reduce((acc, quest) => {
      const month = new Date(quest.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long"
      })
      if (!acc[month]) {
        acc[month] = []
      }
      acc[month].push(quest)
      return acc
    }, {} as Record<string, QuestPublic[]>)
  }, [filteredQuests])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const getQuestDuration = (quest: QuestPublic) => {
    if (!quest.starts_at || !quest.deadline) return null

    const start = new Date(quest.starts_at)
    const end = new Date(quest.deadline)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return `${diffDays} days`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`
    return `${Math.ceil(diffDays / 30)} months`
  }

  if (isLoading) {
    return <QuestHistorySkeleton />
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Quest History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quests</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
                <SelectItem value="created">Created by Me</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(categoryColors).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quest Timeline */}
          {Object.keys(questsByMonth).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-muted-foreground">
                No quests found with the current filters.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or create your first quest!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(questsByMonth)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([month, quests]) => (
                <Collapsible key={month} defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold">{month}</h3>
                      <Badge variant="secondary">{quests.length}</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-3 pl-6">
                      {quests.map((quest) => (
                        <Card key={quest.id} className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                          <CardContent className="p-4 pl-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold hover:text-primary cursor-pointer">
                                    {quest.title}
                                  </h4>
                                  <Badge className={statusColors[quest.status as QuestStatus]}>
                                    {quest.status}
                                  </Badge>
                                  {quest.creator_id === userId && (
                                    <Badge variant="outline" className="text-xs">
                                      Created by you
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {quest.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Badge className={categoryColors[quest.category] || categoryColors.OTHER}>
                                      {quest.category}
                                    </Badge>
                                  </div>

                                  {quest.location_detail && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{quest.location_detail}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{quest.party_size_min}-{quest.party_size_max} members</span>
                                  </div>

                                  {quest.starts_at && quest.deadline && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{getQuestDuration(quest)}</span>
                                    </div>
                                  )}

                                  <span className="text-xs">
                                    Created {formatDate(quest.created_at)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                {quest.status === "COMPLETED" && (
                                  <div className="text-green-600">
                                    <Trophy className="w-4 h-4" />
                                  </div>
                                )}

                                <Button variant="ghost" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Quest Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quest Completionist</span>
                <span className="text-xs text-muted-foreground">
                  {questStats.completed}/10
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((questStats.completed / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete 10 quests to unlock this achievement
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quest Creator</span>
                <span className="text-xs text-muted-foreground">
                  {questStats.created}/5
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((questStats.created / 5) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Create 5 quests to unlock this achievement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuestHistorySkeleton() {
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
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-8 w-32 mb-2" />
                <div className="space-y-2 pl-6">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Card key={j}>
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <div className="flex gap-4">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-14" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
