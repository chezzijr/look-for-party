import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react"
import type { QuestFormData } from "./QuestCreationWizard"
import type { CommitmentLevel } from "@/client"
import { formatDateForInput } from "@/utils/formatters"

const logisticsSchema = z.object({
  required_commitment: z.enum(["CASUAL", "MODERATE", "SERIOUS", "PROFESSIONAL"]),
  location_type: z.enum(["REMOTE", "IN_PERSON", "HYBRID"]),
  location_detail: z.string().optional(),
  starts_at: z.string().optional(),
  deadline: z.string().optional(),
  estimated_duration: z.string().optional(),
  auto_approve: z.boolean(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
}).refine((data) => {
  if (data.location_type === "IN_PERSON" && !data.location_detail?.trim()) {
    return false
  }
  return true
}, {
  message: "Location details are required for in-person quests",
  path: ["location_detail"],
}).refine((data) => {
  // Check if start date is in the past
  if (data.starts_at) {
    const startDate = new Date(data.starts_at)
    const now = new Date()
    // Set time to start of day for comparison to avoid timezone issues
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

    if (start < today) {
      return false
    }
  }
  return true
}, {
  message: "Start date cannot be in the past",
  path: ["starts_at"],
}).refine((data) => {
  // Check if deadline is after start date
  if (data.starts_at && data.deadline) {
    const startDate = new Date(data.starts_at)
    const deadlineDate = new Date(data.deadline)

    if (deadlineDate <= startDate) {
      return false
    }
  }
  return true
}, {
  message: "Deadline must be after start date",
  path: ["deadline"],
})

type LogisticsFormData = z.infer<typeof logisticsSchema>

interface LogisticsStepProps {
  data: QuestFormData
  onChange: (data: Partial<QuestFormData>) => void
  onNext: () => void
  onPrev: () => void
}

const COMMITMENT_LEVELS: { value: CommitmentLevel; label: string; description: string }[] = [
  { value: "CASUAL", label: "Casual", description: "Flexible schedule, few hours per week" },
  { value: "MODERATE", label: "Moderate", description: "Regular commitment, several hours per week" },
  { value: "SERIOUS", label: "Serious", description: "Dedicated involvement, significant time investment" },
  { value: "PROFESSIONAL", label: "Professional", description: "Full-time or high-stakes commitment" },
]

export function LogisticsStep({ data, onChange, onNext, onPrev }: LogisticsStepProps) {
  const form = useForm<LogisticsFormData>({
    resolver: zodResolver(logisticsSchema),
    defaultValues: {
      required_commitment: data.required_commitment || "MODERATE",
      location_type: data.location_type || "REMOTE",
      location_detail: data.location_detail || "",
      starts_at: data.starts_at || "",
      deadline: data.deadline || "",
      estimated_duration: data.estimated_duration || "",
      auto_approve: data.auto_approve || false,
      visibility: data.visibility || "PUBLIC",
    },
  })

  const locationTypeValue = form.watch("location_type")
  const selectedCommitment = COMMITMENT_LEVELS.find(level => level.value === form.watch("required_commitment"))

  const onSubmit = (values: LogisticsFormData) => {
    // Convert date strings to ISO format if provided
    const processedValues = {
      ...values,
      starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      location_detail: values.location_detail?.trim() || null,
    }

    onChange(processedValues)
    onNext()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quest Logistics</CardTitle>
        <CardDescription>
          Set the timeline, location, and commitment expectations for your quest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Commitment Level */}
            <FormField
              control={form.control}
              name="required_commitment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commitment Level *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commitment level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMITMENT_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCommitment && (
                    <FormDescription>
                      {selectedCommitment.description}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Type */}
            <FormField
              control={form.control}
              name="location_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="REMOTE" id="remote" />
                        <Label htmlFor="remote" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Remote - Work from anywhere
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="IN_PERSON" id="in-person" />
                        <Label htmlFor="in-person" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          In-Person - Meet at a specific location
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="HYBRID" id="hybrid" />
                        <Label htmlFor="hybrid" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Hybrid - Mix of remote and in-person
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Details */}
            {(locationTypeValue === "IN_PERSON" || locationTypeValue === "HYBRID") && (
              <FormField
                control={form.control}
                name="location_detail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Location Details {locationTypeValue === "IN_PERSON" ? "*" : ""}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., San Francisco, CA or specific venue details"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Specify the city, venue, or other location information.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={formatDateForInput(field.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      When do you plan to start?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={formatDateForInput(field.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      When should this be completed?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimated Duration */}
            <FormField
              control={form.control}
              name="estimated_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 2 weeks, 1 month, 3 days"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How long do you expect this quest to take?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quest Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Quest Settings</h3>

              <FormField
                control={form.control}
                name="auto_approve"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-approve applications</FormLabel>
                      <FormDescription>
                        Automatically accept applications instead of reviewing them manually
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quest Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public - Anyone can see and apply</SelectItem>
                        <SelectItem value="UNLISTED">Unlisted - Only those with link can see</SelectItem>
                        <SelectItem value="PRIVATE">Private - Invite only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onPrev} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                Next: Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
