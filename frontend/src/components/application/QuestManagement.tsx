import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "@tanstack/react-router"
import { Eye, Users, Clock, MessageCircle, FileText, Plus, Settings, CheckCircle, GitCompare, UserCheck } from "lucide-react"

import type { QuestPublic, ApplicationStatus } from "@/client"
import useMyQuests from "@/hooks/useMyQuests"
import useQuestApplications from "@/hooks/useQuestApplications"
import useQuestClose from "@/hooks/useQuestClose"
import { formatDate, getCategoryColor, getQuestStatusColor } from "@/utils/formatters"
import { ApplicationCard } from "./ApplicationCard"
import { ApplicationReview } from "./ApplicationReview"
import { ApplicationComparison } from "./ApplicationComparison"
import { PartyFormationPreview } from "./PartyFormationPreview"
import { QuestCloseDialog } from "../quest/QuestCloseDialog"

const statusTabs: { value: ApplicationStatus | "all"; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: FileText },
  { value: "PENDING", label: "Pending", icon: Clock },
  { value: "APPROVED", label: "Approved", icon: Users },
  { value: "REJECTED", label: "Rejected", icon: MessageCircle },
]

interface QuestCardProps {
  quest: QuestPublic
  onSelectQuest: (quest: QuestPublic) => void
  isSelected: boolean
  approvedApplicationsCount: number
  onCloseQuest: (questId: string) => void
  isClosing: boolean
}

function QuestCard({ quest, onSelectQuest, isSelected, approvedApplicationsCount, onCloseQuest, isClosing }: QuestCardProps) {
  const totalPartySize = approvedApplicationsCount + 1 // +1 for creator
  const canCloseQuest = quest.status === "RECRUITING" && totalPartySize >= quest.party_size_min && !isClosing
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"
      }`}
      onClick={() => onSelectQuest(quest)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{quest.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={getCategoryColor(quest.category)}
                variant="outline"
              >
                {quest.category}
              </Badge>
              <Badge
                className={getQuestStatusColor(quest.status)}
                variant="outline"
              >
                {quest.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{quest.party_size_min} - {quest.party_size_max} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Created {formatDate(quest.created_at)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {quest.description}
        </p>
        {quest.status === "RECRUITING" && (
          <div className="bg-muted p-3 rounded text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Party Size:</span>
              <span className="font-medium">{totalPartySize} / {quest.party_size_min}-{quest.party_size_max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved:</span>
              <span className="font-medium">{approvedApplicationsCount}</span>
            </div>
            {canCloseQuest && (
              <div className="flex items-center gap-1 text-green-600 mt-1">
                <CheckCircle className="h-3 w-3" />
                <span className="font-medium">Ready to close!</span>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/quests/$questId" params={{ questId: quest.id }}>
              <Eye className="h-4 w-4 mr-2" />
              View Quest
            </Link>
          </Button>
          {quest.status === "RECRUITING" && (
            <QuestCloseDialog
              quest={quest}
              approvedApplicationsCount={approvedApplicationsCount}
              onClose={() => onCloseQuest(quest.id)}
              isLoading={isClosing}
            >
              <Button
                variant={canCloseQuest ? "destructive" : "outline"}
                size="sm"
                disabled={!canCloseQuest || isClosing}
              >
                <Settings className="h-4 w-4 mr-2" />
                Close
              </Button>
            </QuestCloseDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function QuestManagement() {
  const [selectedQuest, setSelectedQuest] = useState<QuestPublic | null>(null)
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">("all")
  const [reviewingApplication, setReviewingApplication] = useState<any>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [showPartyPreview, setShowPartyPreview] = useState(false)

  const { data: questsData, isLoading: questsLoading } = useMyQuests()
  const { data: applicationsData, isLoading: applicationsLoading } = useQuestApplications({
    questId: selectedQuest?.id || "",
    status: activeTab === "all" ? undefined : activeTab
  })
  const { data: approvedApplicationsData } = useQuestApplications({
    questId: selectedQuest?.id || "",
    status: "APPROVED"
  })

  // Quest closing functionality
  const { closeQuest, isClosing } = useQuestClose({
    navigateToParty: false, // Stay in quest management view
    onSuccess: (questId) => {
      // Refresh the quest list after closing
      if (selectedQuest?.id === questId) {
        setSelectedQuest(null)
      }
    }
  })

  const quests = questsData?.data || []
  const applications = applicationsData?.data || []
  const approvedApplicationsCount = approvedApplicationsData?.data?.length || 0

  // Auto-select first quest if none selected
  if (quests.length > 0 && !selectedQuest) {
    setSelectedQuest(quests[0])
  }

  const handleReviewApplication = (application: any) => {
    setReviewingApplication(application)
  }

  const handleCloseQuest = (questId: string) => {
    closeQuest({ questId })
  }

  if (questsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading quests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Quests</h1>
          <p className="text-muted-foreground">
            Manage your created quests and review applications
          </p>
        </div>
        <Button asChild>
          <Link to="/quests/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Quest
          </Link>
        </Button>
      </div>

      {quests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              No Quests Created
            </CardTitle>
            <CardDescription>
              You haven't created any quests yet. Create your first quest to start building your team!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                Ready to start your first quest?
              </div>
              <Button asChild>
                <Link to="/quests/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Quest
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quest List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold">Your Quests</h2>
            <div className="space-y-3">
              {quests.map((quest) => {
                // Get approved applications count for each quest
                const questApprovedCount = quest.id === selectedQuest?.id ? approvedApplicationsCount : 0
                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onSelectQuest={setSelectedQuest}
                    isSelected={selectedQuest?.id === quest.id}
                    approvedApplicationsCount={questApprovedCount}
                    onCloseQuest={handleCloseQuest}
                    isClosing={isClosing}
                  />
                )
              })}
            </div>
          </div>

          {/* Applications Panel */}
          <div className="lg:col-span-2">
            {selectedQuest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Applications for "{selectedQuest.title}"
                    </h2>
                    <p className="text-muted-foreground">
                      Review and manage applications for this quest
                    </p>
                  </div>
                  {selectedQuest.status === "RECRUITING" && (
                    <div className="text-right space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        Party Size: {approvedApplicationsCount + 1} / {selectedQuest.party_size_min}-{selectedQuest.party_size_max}
                      </div>
                      <div className="flex gap-2">
                        {applications.filter((app) => app.status === "PENDING").length >= 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowComparison(true)}
                          >
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare
                          </Button>
                        )}
                        {approvedApplicationsCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPartyPreview(true)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Preview Party
                          </Button>
                        )}
                        <QuestCloseDialog
                          quest={selectedQuest}
                          approvedApplicationsCount={approvedApplicationsCount}
                          onClose={() => handleCloseQuest(selectedQuest.id)}
                          isLoading={isClosing}
                        >
                          <Button
                            variant={approvedApplicationsCount + 1 >= selectedQuest.party_size_min ? "destructive" : "outline"}
                            size="sm"
                            disabled={approvedApplicationsCount + 1 < selectedQuest.party_size_min || isClosing}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Close Quest
                          </Button>
                        </QuestCloseDialog>
                      </div>
                    </div>
                  )}
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ApplicationStatus | "all")}>
                  <TabsList className="grid w-full grid-cols-4">
                    {statusTabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {statusTabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                      {applicationsLoading ? (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">Loading applications...</div>
                        </div>
                      ) : applications.length === 0 ? (
                        <Card>
                          <CardContent className="text-center py-8">
                            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                              No {tab.label.toLowerCase()} applications
                            </h3>
                            <p className="text-muted-foreground">
                              {tab.value === "all"
                                ? "No one has applied to this quest yet."
                                : `No ${tab.label.toLowerCase()} applications for this quest.`
                              }
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {applications.map((application) => (
                            <ApplicationCard
                              key={application.id}
                              application={application}
                              showQuestInfo={false}
                              showActions={true}
                              onReview={handleReviewApplication}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a Quest
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a quest from the left panel to view its applications.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Application Review Dialog */}
      {reviewingApplication && selectedQuest && (
        <ApplicationReview
          application={reviewingApplication}
          questId={selectedQuest.id}
          isOpen={!!reviewingApplication}
          onClose={() => setReviewingApplication(null)}
        />
      )}

      {/* Application Comparison Dialog */}
      {selectedQuest && (
        <ApplicationComparison
          applications={applications.filter((app) => app.status === "PENDING")}
          questId={selectedQuest.id}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Party Formation Preview Dialog */}
      {selectedQuest && approvedApplicationsCount > 0 && (
        <div className={showPartyPreview ? "block" : "hidden"}>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPartyPreview(false)}>
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-background p-6 overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Party Formation Preview</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPartyPreview(false)}>
                  ✕
                </Button>
              </div>
              <PartyFormationPreview
                quest={selectedQuest}
                approvedApplications={approvedApplicationsData?.data || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
