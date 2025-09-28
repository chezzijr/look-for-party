import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Settings, Calendar, MessageCircle } from "lucide-react"
import { usePartyDetail } from "@/hooks/usePartyDetail"
import { usePartyMembers } from "@/hooks/usePartyMembers"
import { PartyHeader } from "./PartyHeader"
import { MemberList } from "./MemberList"
import { PartyQuests } from "./PartyQuests"
import { PartySettings } from "./PartySettings"
import { getPartyStatusColor, formatDate } from "@/utils/formatters"

interface PartyDashboardProps {
  partyId: string
}

export function PartyDashboard({ partyId }: PartyDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { data: party, isLoading: partyLoading, error: partyError } = usePartyDetail(partyId)
  const { data: membersData } = usePartyMembers(partyId)

  if (partyLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading party details...</div>
      </div>
    )
  }

  if (partyError || !party) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Party not found or you don't have access to this party.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const memberCount = membersData?.count || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Party Header */}
      <PartyHeader party={party} memberCount={memberCount} />

      {/* Main Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Quests
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Party Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Party Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="font-medium">{memberCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getPartyStatusColor(party.status || "ACTIVE")}>
                    {party.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Formed</span>
                  <span className="text-sm">{formatDate(party.formed_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  No recent activity to display.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Party Description */}
          {party.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Party</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{party.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members">
          <MemberList partyId={partyId} party={party} />
        </TabsContent>

        <TabsContent value="quests">
          <PartyQuests partyId={partyId} party={party} />
        </TabsContent>

        <TabsContent value="settings">
          <PartySettings partyId={partyId} party={party} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
