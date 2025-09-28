import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Users, EyeOff, Eye, Target } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { PartyPublic, PartyMemberPublic } from "@/client"

const questFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  objective: z.string().min(10, "Objective must be at least 10 characters").max(500, "Objective must be less than 500 characters"),
  category: z.enum(["GAMING", "PROFESSIONAL", "SOCIAL", "LEARNING", "CREATIVE", "FITNESS", "TRAVEL"]),
  quest_type: z.enum(["PARTY_INTERNAL", "PARTY_EXPANSION", "PARTY_HYBRID"]),
  required_commitment: z.enum(["CASUAL", "MODERATE", "SERIOUS", "PROFESSIONAL"]),
  location_type: z.enum(["REMOTE", "IN_PERSON", "HYBRID"]),
  location_detail: z.string().optional(),
  estimated_duration: z.string().optional(),
  deadline: z.string().optional(),
  starts_at: z.string().optional(),
  // Internal quest fields
  assigned_member_ids: z.array(z.string()).optional(),
  internal_slots: z.number().min(0).default(0),
  // Expansion quest fields
  party_size_min: z.number().min(1).max(50).optional(),
  party_size_max: z.number().min(1).max(50).optional(),
  public_slots: z.number().min(0).default(0),
  // Common fields
  auto_approve: z.boolean().default(false),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PRIVATE"),
})

type QuestFormData = z.infer<typeof questFormSchema>

interface QuestCreateModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  party: PartyPublic
  members: PartyMemberPublic[]
  onSubmit: (data: QuestFormData) => Promise<void>
  isLoading?: boolean
}

const questTypeOptions = [
  {
    value: "PARTY_INTERNAL" as const,
    label: "Internal Task",
    description: "Assign tasks to existing party members only",
    icon: <EyeOff className="h-4 w-4" />,
  },
  {
    value: "PARTY_EXPANSION" as const,
    label: "Recruit New Members",
    description: "Public quest to expand your party",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    value: "PARTY_HYBRID" as const,
    label: "Hybrid Quest",
    description: "Start internal, expand to public later",
    icon: <Target className="h-4 w-4" />,
  },
]

export function QuestCreateModal({
  isOpen,
  onOpenChange,
  party,
  members,
  onSubmit,
  isLoading = false,
}: QuestCreateModalProps) {
  const [selectedQuestType, setSelectedQuestType] = useState<"PARTY_INTERNAL" | "PARTY_EXPANSION" | "PARTY_HYBRID">("PARTY_INTERNAL")

  const form = useForm<QuestFormData>({
    resolver: zodResolver(questFormSchema),
    defaultValues: {
      title: "",
      description: "",
      objective: "",
      category: "PROFESSIONAL",
      quest_type: "PARTY_INTERNAL",
      required_commitment: "MODERATE",
      location_type: "REMOTE",
      location_detail: "",
      estimated_duration: "",
      deadline: "",
      starts_at: "",
      assigned_member_ids: [],
      internal_slots: 0,
      party_size_min: 1,
      party_size_max: 3,
      public_slots: 0,
      auto_approve: false,
      visibility: "PRIVATE",
    },
  })

  const watchedQuestType = form.watch("quest_type")

  const handleQuestTypeChange = (type: "PARTY_INTERNAL" | "PARTY_EXPANSION" | "PARTY_HYBRID") => {
    setSelectedQuestType(type)
    form.setValue("quest_type", type)

    // Reset type-specific fields
    if (type === "PARTY_INTERNAL") {
      form.setValue("visibility", "PRIVATE")
      form.setValue("party_size_min", undefined)
      form.setValue("party_size_max", undefined)
      form.setValue("public_slots", 0)
    } else {
      form.setValue("assigned_member_ids", [])
      form.setValue("internal_slots", 0)
      form.setValue("visibility", "PUBLIC")
      form.setValue("party_size_min", 1)
      form.setValue("party_size_max", 3)
    }
  }

  const handleSubmit = async (data: QuestFormData) => {
    try {
      // Convert date strings to Date objects if provided
      const processedData = {
        ...data,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : undefined,
      }

      await onSubmit(processedData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create quest:", error)
    }
  }

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    const currentIds = form.getValues("assigned_member_ids") || []
    if (checked) {
      form.setValue("assigned_member_ids", [...currentIds, memberId])
    } else {
      form.setValue("assigned_member_ids", currentIds.filter(id => id !== memberId))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Party Quest</DialogTitle>
          <DialogDescription>
            Create a quest for {party.name} to coordinate tasks or recruit new members.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Quest Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Quest Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {questTypeOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedQuestType === option.value
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleQuestTypeChange(option.value)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {option.icon}
                        {option.label}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {option.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="logistics">Logistics</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quest Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 'Review code architecture' or 'Need React developer'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed information about the quest, what's needed, and expectations..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objective</FormLabel>
                      <FormControl>
                        <Input placeholder="What should be accomplished?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                          <SelectItem value="GAMING">Gaming</SelectItem>
                          <SelectItem value="CREATIVE">Creative</SelectItem>
                          <SelectItem value="LEARNING">Learning</SelectItem>
                          <SelectItem value="SOCIAL">Social</SelectItem>
                          <SelectItem value="FITNESS">Fitness</SelectItem>
                          <SelectItem value="TRAVEL">Travel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                {watchedQuestType === "PARTY_INTERNAL" ? (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Assign to Party Members</Label>
                    <div className="space-y-2">
                      {members.map((member) => {
                        // Handle cases where user data might not be populated
                        const userId = member.user?.id || member.user_id
                        const username = member.user?.username || member.user?.email || `User ${member.user_id}`

                        if (!userId) {
                          console.warn("Member missing user data:", member)
                          return null
                        }

                        return (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={member.id}
                              onCheckedChange={(checked) => handleMemberToggle(userId, checked as boolean)}
                            />
                            <Label htmlFor={member.id} className="flex items-center gap-2">
                              <span>{username}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                    <FormDescription>
                      Select which party members should work on this quest.
                    </FormDescription>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="party_size_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum New Members</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="party_size_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum New Members</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="required_commitment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Commitment Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select commitment level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASUAL">Casual</SelectItem>
                          <SelectItem value="MODERATE">Moderate</SelectItem>
                          <SelectItem value="SERIOUS">Serious</SelectItem>
                          <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="logistics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REMOTE">Remote</SelectItem>
                            <SelectItem value="IN_PERSON">In-person</SelectItem>
                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., '2 weeks', '3 days'" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location_detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Details (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Specific location if applicable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="starts_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline (optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchedQuestType !== "PARTY_INTERNAL" && (
                  <FormField
                    control={form.control}
                    name="auto_approve"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Auto-approve applications</FormLabel>
                          <FormDescription>
                            Automatically approve applications without manual review.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Quest"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
