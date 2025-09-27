import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import useTagSuggestions from "@/hooks/useTagSuggestions"
import type { QuestCategory, TagPublic, LocationType } from "@/client"

interface QuestFiltersProps {
  filters: {
    category?: QuestCategory
    location_type?: LocationType
    party_size_min?: number
    party_size_max?: number
    tag_ids?: string[]
    // status still needed internally but not shown in UI
  }
  onFilterChange: (filters: Partial<QuestFiltersProps["filters"]>) => void
  onClearFilters: () => void
}

const categories: { value: QuestCategory; label: string }[] = [
  { value: "GAMING", label: "Gaming" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "SOCIAL", label: "Social" },
  { value: "LEARNING", label: "Learning" },
  { value: "CREATIVE", label: "Creative" },
  { value: "FITNESS", label: "Fitness" },
  { value: "TRAVEL", label: "Travel" },
]

const locationTypes: { value: LocationType; label: string }[] = [
  { value: "REMOTE", label: "Remote" },
  { value: "IN_PERSON", label: "In-person" },
  { value: "HYBRID", label: "Hybrid" },
]


export function QuestFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: QuestFiltersProps) {
  const [tagInput, setTagInput] = useState("")
  const [selectedTags, setSelectedTags] = useState<TagPublic[]>([])

  const { data: tagSuggestions } = useTagSuggestions({
    query: tagInput,
    limit: 5
  })

  const addTag = (tag: TagPublic) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      onFilterChange({ tag_ids: newTags.map(t => t.id) })
      setTagInput("")
    }
  }

  const removeTag = (tagId: string) => {
    const newTags = selectedTags.filter(t => t.id !== tagId)
    setSelectedTags(newTags)
    onFilterChange({ tag_ids: newTags.length > 0 ? newTags.map(t => t.id) : undefined })
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Category</Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`category-${category.value}`}
                  name="category"
                  checked={filters.category === category.value}
                  onChange={() =>
                    onFilterChange({
                      category: category.value
                    })
                  }
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`category-${category.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category.label}
                </Label>
              </div>
            ))}
            {filters.category && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange({ category: undefined })}
                className="text-xs"
              >
                Clear category
              </Button>
            )}
          </div>
        </div>

        {/* Location Type Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Location</Label>
          <div className="space-y-2">
            {locationTypes.map((locationType) => (
              <div key={locationType.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`location-${locationType.value}`}
                  name="location_type"
                  checked={filters.location_type === locationType.value}
                  onChange={() =>
                    onFilterChange({
                      location_type: locationType.value
                    })
                  }
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`location-${locationType.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {locationType.label}
                </Label>
              </div>
            ))}
            {filters.location_type && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange({ location_type: undefined })}
                className="text-xs"
              >
                Clear location
              </Button>
            )}
          </div>
        </div>

        {/* Party Size Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Party Size</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Min"
                min="1"
                max="50"
                value={filters.party_size_min || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? undefined : parseInt(e.target.value)
                  onFilterChange({ party_size_min: value })
                }}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Max"
                min="1"
                max="50"
                value={filters.party_size_max || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? undefined : parseInt(e.target.value)
                  onFilterChange({ party_size_max: value })
                }}
                className="text-sm"
              />
            </div>
          </div>
          {(filters.party_size_min || filters.party_size_max) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange({ party_size_min: undefined, party_size_max: undefined })}
              className="text-xs mt-2"
            >
              Clear party size
            </Button>
          )}
        </div>

        {/* Tags Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Skills/Tags</Label>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for skills..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="text-sm"
              />
              {tagInput.length >= 2 && tagSuggestions?.data && tagSuggestions.data.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                  {tagSuggestions.data.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => addTag(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTags([])
                  onFilterChange({ tag_ids: undefined })
                }}
                className="text-xs"
              >
                Clear tags
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
            <div className="flex flex-wrap gap-1">
              {filters.category && (
                <Badge variant="secondary" className="text-xs">
                  {categories.find(c => c.value === filters.category)?.label}
                </Badge>
              )}
              {filters.location_type && (
                <Badge variant="secondary" className="text-xs">
                  {locationTypes.find(l => l.value === filters.location_type)?.label}
                </Badge>
              )}
              {(filters.party_size_min || filters.party_size_max) && (
                <Badge variant="secondary" className="text-xs">
                  Party Size: {filters.party_size_min || "?"}-{filters.party_size_max || "?"}
                </Badge>
              )}
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
