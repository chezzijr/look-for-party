import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Plus,
  Users,
  Eye,
  EyeOff,
  Clock,
  Target,
  CheckCircle,
  ExternalLink,
  UserPlus,
  XCircle
} from "lucide-react"
import { formatDate, getQuestStatusColor } from "@/utils/formatters"
import type { PartyPublic, QuestPublic, PartyMemberDetail } from "@/client"
import { QuestCreateModal } from "./QuestCreateModal"
import { QuestAssignModal } from "./QuestAssignModal"
import {
  usePartyQuestsByType,
  useCreatePartyQuest,
  usePublicizeQuest,
  useAssignQuestMembers,
  useCompleteQuest,
  useCancelQuest
} from "@/hooks/usePartyQuests"
import { usePartyMembers } from "@/hooks/usePartyMembers"
import useAuth from "@/hooks/useAuth"

interface PartyQuestsProps {
  partyId: string
  party: PartyPublic
}

interface QuestCardProps {
  quest: QuestPublic
  type: "internal" | "public" | "hybrid"
  onPublicize?: (quest: QuestPublic) => void
  onAssign?: (quest: QuestPublic) => void
  onComplete?: (quest: QuestPublic) => void
  onCancel?: (quest: QuestPublic) => void
  canManage?: boolean
}

function QuestCard({ quest, type, onPublicize, onAssign, onComplete, onCancel, canManage = false }: QuestCardProps) {
  const getQuestTypeIcon = (questType: string) => {
    switch (questType) {
      case "internal":
        return <EyeOff className="h-4 w-4" />
      case "public":
        return <Eye className="h-4 w-4" />
      case "hybrid":
        return <Target className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getQuestTypeBadge = (questType: string) => {
    switch (questType) {
      case "internal":
        return <Badge variant="secondary">Internal</Badge>
      case "public":
        return <Badge variant="default">Public</Badge>
      case "hybrid":
        return <Badge variant="outline">Hybrid</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Get quest member count from the API field
  const assignedCount = quest.quest_members_count || 0

  const isInProgress = quest.status === "IN_PROGRESS"
  const isRecruiting = quest.status === "RECRUITING"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg line-clamp-1">
                {quest.title}
              </CardTitle>
              <Badge className={getQuestStatusColor(quest.status)}>
                {quest.status}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {quest.description}
            </CardDescription>
          </div>
          {getQuestTypeBadge(type)}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {getQuestTypeIcon(type)}
            <span className="capitalize">{type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {type === "internal"
                ? `${assignedCount} assigned`
                : `${quest.party_size_min || 0}-${quest.party_size_max || 0} members`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(quest.created_at)}</span>
          </div>
        </div>

        {quest.deadline && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Deadline:</span> {formatDate(quest.deadline)}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to="/quests/$questId" params={{ questId: quest.id }}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Link>
          </Button>

          {canManage && type === "internal" && !quest.is_publicized && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAssign?.(quest)}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Assign
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPublicize?.(quest)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Make Public
              </Button>
            </>
          )}

          {canManage && type === "hybrid" && !quest.is_publicized && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPublicize?.(quest)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Publicize
            </Button>
          )}

          {canManage && isInProgress && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComplete?.(quest)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel?.(quest)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </>
          )}

          {canManage && isRecruiting && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel?.(quest)}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  type,
  onCreateQuest
}: {
  type: "internal" | "public" | "hybrid"
  onCreateQuest?: (type: "internal" | "public" | "hybrid") => void
}) {
  const getEmptyMessage = () => {
    switch (type) {
      case "internal":
        return "No internal quests yet. Create one to assign tasks to party members."
      case "public":
        return "No public quests yet. Create one to recruit new members."
      case "hybrid":
        return "No hybrid quests yet. Create one that can start internal and expand later."
      default:
        return "No quests found."
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case "internal":
        return "Internal"
      case "public":
        return "Public"
      case "hybrid":
        return "Hybrid"
      default:
        return "Quest"
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            {getEmptyMessage()}
          </div>
          {onCreateQuest && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => onCreateQuest(type)}
            >
              <Plus className="h-4 w-4" />
              Create {getTypeLabel()} Quest
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PartyQuests({ partyId, party }: PartyQuestsProps) {
  const [activeTab, setActiveTab] = useState("internal")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedQuestForAssignment, setSelectedQuestForAssignment] = useState<QuestPublic | null>(null)

  const { user: currentUser } = useAuth()
  const { data: membersData } = usePartyMembers(partyId)
  const {
    internalQuests,
    publicQuests,
    hybridQuests,
    isLoading,
    error
  } = usePartyQuestsByType(partyId)

  // Mutations
  const createQuestMutation = useCreatePartyQuest(partyId)
  const publicizeMutation = usePublicizeQuest()
  const assignMutation = useAssignQuestMembers()
  const completeMutation = useCompleteQuest()
  const cancelMutation = useCancelQuest()

  // Check if current user can manage quests (owner or moderator)
  const canCreateQuests = membersData?.data?.some(
    (member: PartyMemberDetail) => {
      const userId = member.user?.id || member.user_id
      return userId === currentUser?.id &&
        (member.role === "OWNER" || member.role === "MODERATOR")
    }
  ) || false

  const handleCreateQuest = () => {
    setIsCreateModalOpen(true)
  }

  const handleSubmitQuest = async (questData: any) => {
    await createQuestMutation.mutateAsync(questData)
  }

  const handlePublicizeQuest = async (quest: QuestPublic) => {
    // Default publicize settings - could be made configurable
    await publicizeMutation.mutateAsync({
      questId: quest.id,
      data: {
        public_slots: 3, // Default 3 slots
        visibility: "PUBLIC",
      },
    })
  }

  const handleAssignMembers = (quest: QuestPublic) => {
    setSelectedQuestForAssignment(quest)
    setIsAssignModalOpen(true)
  }

  const handleSubmitAssignment = async (data: { user_ids: string[]; assignment_reason?: string }) => {
    if (!selectedQuestForAssignment) return

    await assignMutation.mutateAsync({
      questId: selectedQuestForAssignment.id,
      data,
    })
  }

  const handleCompleteQuest = async (quest: QuestPublic) => {
    await completeMutation.mutateAsync(quest.id)
  }

  const handleCancelQuest = async (quest: QuestPublic) => {
    await cancelMutation.mutateAsync(quest.id)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              Loading party quests...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-red-600">
              Failed to load party quests. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quest Management Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Party Quests
              </CardTitle>
              <CardDescription>
                Create and manage quests for your party members or recruit new talent.
              </CardDescription>
            </div>
            {canCreateQuests && (
              <Button
                className="flex items-center gap-2"
                onClick={handleCreateQuest}
              >
                <Plus className="h-4 w-4" />
                Create Quest
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Quest Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="internal" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Internal ({internalQuests.length})
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Public ({publicQuests.length})
          </TabsTrigger>
          <TabsTrigger value="hybrid" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Hybrid ({hybridQuests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Internal quests are tasks assigned to existing party members. They're only visible
            to your party and help coordinate work among team members.
          </div>
          {internalQuests.length === 0 ? (
            <EmptyState
              type="internal"
              onCreateQuest={canCreateQuests ? () => handleCreateQuest() : undefined}
            />
          ) : (
            <div className="space-y-4">
              {internalQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  type="internal"
                  canManage={canCreateQuests}
                  onPublicize={handlePublicizeQuest}
                  onAssign={handleAssignMembers}
                  onComplete={handleCompleteQuest}
                  onCancel={handleCancelQuest}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Public quests are visible on the quest board and help you recruit new members
            to join your party. Perfect for expanding your team with specific skills.
          </div>
          {publicQuests.length === 0 ? (
            <EmptyState
              type="public"
              onCreateQuest={canCreateQuests ? () => handleCreateQuest() : undefined}
            />
          ) : (
            <div className="space-y-4">
              {publicQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  type="public"
                  canManage={canCreateQuests}
                  onComplete={handleCompleteQuest}
                  onCancel={handleCancelQuest}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hybrid" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Hybrid quests start as internal tasks but can be publicized later to recruit
            external members when needed.
          </div>
          {hybridQuests.length === 0 ? (
            <EmptyState
              type="hybrid"
              onCreateQuest={canCreateQuests ? () => handleCreateQuest() : undefined}
            />
          ) : (
            <div className="space-y-4">
              {hybridQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  type="hybrid"
                  canManage={canCreateQuests}
                  onPublicize={handlePublicizeQuest}
                  onAssign={handleAssignMembers}
                  onComplete={handleCompleteQuest}
                  onCancel={handleCancelQuest}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {canCreateQuests && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto p-4"
                onClick={handleCreateQuest}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 font-medium">
                    <EyeOff className="h-4 w-4" />
                    Create Internal Quest
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Assign tasks to existing party members
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto p-4"
                onClick={handleCreateQuest}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 font-medium">
                    <Eye className="h-4 w-4" />
                    Create Public Quest
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Recruit new members to join your party
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto p-4"
                onClick={handleCreateQuest}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 font-medium">
                    <Target className="h-4 w-4" />
                    Create Hybrid Quest
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Start internal, expand later
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quest Creation Modal */}
      <QuestCreateModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        party={party}
        members={membersData?.data || []}
        onSubmit={handleSubmitQuest}
        isLoading={createQuestMutation.isPending}
      />

      {/* Quest Assignment Modal */}
      <QuestAssignModal
        isOpen={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        quest={selectedQuestForAssignment}
        members={membersData?.data || []}
        onSubmit={handleSubmitAssignment}
        isLoading={assignMutation.isPending}
      />
    </div>
  )
}
