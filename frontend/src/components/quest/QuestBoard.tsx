import { useState } from "react"
import useQuests from "@/hooks/useQuests"
import { QuestCard } from "./QuestCard"
import { QuestSearch } from "./QuestSearch"
import { QuestFilters } from "./QuestFilters"
import { Button } from "@/components/ui/button"
import { Grid, List, Plus } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import type { QuestCategory, QuestStatus, LocationType } from "@/client"

interface QuestFiltersState {
  category?: QuestCategory
  location_type?: LocationType
  status?: QuestStatus
  search?: string
  party_size_min?: number
  party_size_max?: number
  tag_ids?: string[]
}

export function QuestBoard() {
  const [filters, setFilters] = useState<QuestFiltersState>({
    status: "RECRUITING" as QuestStatus
  })
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const navigate = useNavigate()

  const { data: questsData, isLoading, error } = useQuests({
    category: filters.category,
    location_type: filters.location_type,
    status: filters.status,
    search: filters.search,
    party_size_min: filters.party_size_min,
    party_size_max: filters.party_size_max,
    limit: 50,
  })

  const quests = questsData?.data || []

  const handleFilterChange = (newFilters: Partial<QuestFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({
      status: "RECRUITING" as QuestStatus
    })
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load quests</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and View Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <QuestSearch
            value={filters.search || ""}
            onChange={(search) => handleFilterChange({ search })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate({ to: "/quests/create" })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Quest
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="hidden md:block w-64 shrink-0">
          <QuestFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Quest List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading quests...</p>
            </div>
          ) : quests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0
                  ? "No quests match your filters"
                  : "No quests available"}
              </p>
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
