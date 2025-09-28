import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react"

import type { ApplicationStatus } from "@/client"
import useMyApplications from "@/hooks/useMyApplications"
import useQuests from "@/hooks/useQuests"
import { ApplicationCard } from "./ApplicationCard"

const statusTabs: { value: ApplicationStatus | "all"; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: FileText },
  { value: "PENDING", label: "Pending", icon: Clock },
  { value: "APPROVED", label: "Approved", icon: CheckCircle },
  { value: "REJECTED", label: "Rejected", icon: XCircle },
]

export function ApplicationDashboard() {
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">("all")

  const { data: applicationsData, isLoading } = useMyApplications({
    status: activeTab === "all" ? undefined : activeTab
  })
  const { data: questsData } = useQuests()

  const applications = applicationsData?.data || []
  const quests = questsData?.data || []

  // Create a map for quick quest lookup
  const questMap = new Map(quests.map(quest => [quest.id, quest]))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading applications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of your quest applications
        </p>
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
            {applications.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    No Applications Found
                  </CardTitle>
                  <CardDescription>
                    {tab.value === "all"
                      ? "You haven't applied to any quests yet. Visit the quest board to find opportunities!"
                      : `You don't have any ${tab.label.toLowerCase()} applications.`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      Ready to join a quest?
                    </div>
                    <a
                      href="/quests"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Browse Quests
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {applications.map((application) => {
                  const quest = questMap.get(application.quest_id)
                  return (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      quest={quest}
                      showQuestInfo={true}
                      showActions={false}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
