import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Star, X, Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"

import {
  type UserTagPublic,
  type UserTagsPublic,
  type TagPublic,
  type TagsPublic,
  type UserTagCreate,
  type UserTagUpdate,
  type ProficiencyLevel,
  type TagCategory,
  TagsService,
} from "@/client"
import { handleError } from "@/utils"
import useCustomToast from "@/hooks/useCustomToast"

interface SkillTagManagerProps {
  userId: string
  isOwnProfile: boolean
}

const proficiencyLevels: { value: ProficiencyLevel; label: string; description: string }[] = [
  { value: "BEGINNER", label: "Beginner", description: "Learning the basics" },
  { value: "INTERMEDIATE", label: "Intermediate", description: "Comfortable with fundamentals" },
  { value: "ADVANCED", label: "Advanced", description: "Deep knowledge and experience" },
  { value: "EXPERT", label: "Expert", description: "Can teach and lead others" },
]

const getProficiencyValue = (level: ProficiencyLevel | null): number => {
  if (!level) return 0
  const index = proficiencyLevels.findIndex(p => p.value === level)
  return index >= 0 ? index : 0
}

const getProficiencyLevel = (value: number): ProficiencyLevel => {
  return proficiencyLevels[value]?.value || "BEGINNER"
}

const categoryColors: Record<TagCategory, string> = {
  PROGRAMMING: "bg-blue-100 text-blue-800",
  FRAMEWORK: "bg-purple-100 text-purple-800",
  TOOL: "bg-green-100 text-green-800",
  GAME: "bg-orange-100 text-orange-800",
  GAME_GENRE: "bg-red-100 text-red-800",
  ART: "bg-pink-100 text-pink-800",
  MUSIC: "bg-indigo-100 text-indigo-800",
  MEDIA: "bg-teal-100 text-teal-800",
  SPORT: "bg-yellow-100 text-yellow-800",
  FITNESS: "bg-lime-100 text-lime-800",
  LANGUAGE: "bg-cyan-100 text-cyan-800",
  SUBJECT: "bg-violet-100 text-violet-800",
  SKILL: "bg-emerald-100 text-emerald-800",
  HOBBY: "bg-amber-100 text-amber-800",
  LOCATION: "bg-slate-100 text-slate-800",
  STYLE: "bg-rose-100 text-rose-800",
}

export default function SkillTagManager({ userId, isOwnProfile }: SkillTagManagerProps) {
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<TagCategory | "ALL">("ALL")
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [newProficiency, setNewProficiency] = useState<number>(0)

  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Fetch user's current tags
  const { data: userTags, isLoading: isLoadingUserTags } = useQuery<UserTagsPublic>({
    queryKey: ["user-tags", userId],
    queryFn: () => isOwnProfile
      ? TagsService.readMyUserTags()
      : TagsService.readUserTags({ userId }),
  })

  // Fetch available tags for adding
  const { data: availableTags, isLoading: isLoadingTags } = useQuery<TagsPublic>({
    queryKey: ["tags", searchQuery, selectedCategory],
    queryFn: () => TagsService.readTags({
      search: searchQuery || undefined,
      category: selectedCategory !== "ALL" ? selectedCategory : undefined,
      limit: 50,
    }),
    enabled: isAddingSkill,
  })

  // Mutations
  const addTagMutation = useMutation({
    mutationFn: ({ tag_id, proficiency_level, is_primary }: UserTagCreate & { is_primary?: boolean }) =>
      TagsService.createMyUserTag({
        requestBody: { tag_id, proficiency_level, is_primary },
      }),
    onSuccess: () => {
      showSuccessToast("Skill added successfully")
      queryClient.invalidateQueries({ queryKey: ["user-tags"] })
      setIsAddingSkill(false)
      setSearchQuery("")
    },
    onError: handleError,
  })

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, ...data }: { tagId: string } & UserTagUpdate) =>
      TagsService.updateMyUserTag({ tagId, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Skill updated successfully")
      queryClient.invalidateQueries({ queryKey: ["user-tags"] })
      setEditingTag(null)
    },
    onError: handleError,
  })

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => TagsService.deleteMyUserTag({ tagId }),
    onSuccess: () => {
      showSuccessToast("Skill removed successfully")
      queryClient.invalidateQueries({ queryKey: ["user-tags"] })
    },
    onError: handleError,
  })

  // Group user tags by category
  const groupedUserTags = useMemo(() => {
    if (!userTags?.data) return {}

    return userTags.data.reduce((acc, userTag) => {
      const category = userTag.tag.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(userTag)
      return acc
    }, {} as Record<TagCategory, UserTagPublic[]>)
  }, [userTags])

  const primarySkills = useMemo(() => {
    return userTags?.data.filter(tag => tag.is_primary) || []
  }, [userTags])

  const handleAddSkill = (tag: TagPublic) => {
    addTagMutation.mutate({
      tag_id: tag.id,
      proficiency_level: getProficiencyLevel(newProficiency),
      is_primary: false,
    })
  }

  const handleUpdateProficiency = (tagId: string, value: number) => {
    const proficiency = getProficiencyLevel(value)
    updateTagMutation.mutate({
      tagId,
      proficiency_level: proficiency,
    })
  }

  const handleTogglePrimary = (userTag: UserTagPublic) => {
    updateTagMutation.mutate({
      tagId: userTag.tag.id,
      is_primary: !userTag.is_primary,
    })
  }

  const handleRemoveSkill = (tagId: string) => {
    removeTagMutation.mutate(tagId)
  }

  if (isLoadingUserTags) {
    return <SkillTagSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Primary Skills Section */}
      {primarySkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Primary Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {primarySkills.map((userTag) => (
                <TooltipProvider key={userTag.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="secondary"
                        className={`${categoryColors[userTag.tag.category]} cursor-pointer`}
                      >
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {userTag.tag.name}
                        {userTag.proficiency_level && (
                          <span className="ml-1 text-xs opacity-75">
                            ({proficiencyLevels.find(p => p.value === userTag.proficiency_level)?.label})
                          </span>
                        )}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleTogglePrimary(userTag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{userTag.tag.description || "No description available"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Skills by Category */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills & Tags</CardTitle>
          {isOwnProfile && (
            <Button
              onClick={() => setIsAddingSkill(!isAddingSkill)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Add Skill Interface */}
          {isAddingSkill && isOwnProfile && (
            <div className="border rounded-lg p-4 mb-6 bg-muted/50">
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as TagCategory | "ALL")}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {Object.keys(categoryColors).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Proficiency Level</p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[newProficiency]}
                    onValueChange={([value]) => setNewProficiency(value)}
                    max={3}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-24">
                    {proficiencyLevels[newProficiency]?.label}
                  </span>
                </div>
              </div>

              {isLoadingTags ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableTags?.data
                    ?.filter(tag => !userTags?.data.some(ut => ut.tag.id === tag.id))
                    ?.map((tag) => (
                    <Button
                      key={tag.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSkill(tag)}
                      disabled={addTagMutation.isPending}
                      className="h-8"
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills by Category */}
          {Object.entries(groupedUserTags).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {isOwnProfile ? "No skills added yet. Click 'Add Skill' to get started!" : "No skills to display"}
            </p>
          ) : (
            <div className="space-y-4">
              {(Object.entries(groupedUserTags) as [TagCategory, UserTagPublic[]][]).map(([category, tags]) => (
                <Collapsible key={category} defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                    <h3 className="font-semibold">
                      {category.replace("_", " ")} ({tags.length})
                    </h3>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-2">
                      {tags.map((userTag: UserTagPublic) => (
                        <div
                          key={userTag.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={categoryColors[userTag.tag.category]}>
                              {userTag.tag.name}
                            </Badge>
                            {userTag.proficiency_level && (
                              <span className="text-sm text-muted-foreground">
                                {proficiencyLevels.find(p => p.value === userTag.proficiency_level)?.label}
                              </span>
                            )}
                          </div>

                          {isOwnProfile && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTogglePrimary(userTag)}
                                className={userTag.is_primary ? "text-yellow-600" : "text-muted-foreground"}
                              >
                                <Star className={`w-4 h-4 ${userTag.is_primary ? "fill-current" : ""}`} />
                              </Button>

                              {editingTag === userTag.id ? (
                                <div className="flex items-center gap-2">
                                  <Slider
                                    value={[getProficiencyValue(userTag.proficiency_level || null)]}
                                    onValueChange={([value]) => handleUpdateProficiency(userTag.tag.id, value)}
                                    max={3}
                                    step={1}
                                    className="w-20"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingTag(null)}
                                  >
                                    ✓
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingTag(userTag.id)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveSkill(userTag.tag.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SkillTagSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-24" />
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
