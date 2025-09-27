import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"
import type { QuestFormData } from "./QuestCreationWizard"
import type { QuestCategory } from "@/client"

const basicDetailsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  objective: z.string().min(10, "Objective must be at least 10 characters").max(500, "Objective must be less than 500 characters"),
  category: z.enum(["GAMING", "PROFESSIONAL", "SOCIAL", "LEARNING", "CREATIVE", "FITNESS", "TRAVEL"])
})

type BasicDetailsFormData = z.infer<typeof basicDetailsSchema>

interface BasicDetailsStepProps {
  data: QuestFormData
  onChange: (data: Partial<QuestFormData>) => void
  onNext: () => void
}

const CATEGORIES: { value: QuestCategory; label: string; description: string }[] = [
  { value: "PROFESSIONAL", label: "Professional", description: "Work projects, business ventures, career development" },
  { value: "LEARNING", label: "Learning", description: "Study groups, skill development, educational projects" },
  { value: "CREATIVE", label: "Creative", description: "Art projects, writing, music, design collaborations" },
  { value: "GAMING", label: "Gaming", description: "Video games, board games, competitive tournaments" },
  { value: "SOCIAL", label: "Social", description: "Events, meetups, community building" },
  { value: "FITNESS", label: "Fitness", description: "Workout partners, sports teams, fitness challenges" },
  { value: "TRAVEL", label: "Travel", description: "Trip planning, travel companions, exploration" },
]

export function BasicDetailsStep({ data, onChange, onNext }: BasicDetailsStepProps) {
  const form = useForm<BasicDetailsFormData>({
    resolver: zodResolver(basicDetailsSchema),
    defaultValues: {
      title: data.title || "",
      description: data.description || "",
      objective: data.objective || "",
      category: data.category || "PROFESSIONAL",
    },
  })

  const onSubmit = (values: BasicDetailsFormData) => {
    onChange(values)
    onNext()
  }

  const selectedCategory = CATEGORIES.find(cat => cat.value === form.watch("category"))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Quest Details</CardTitle>
        <CardDescription>
          Start by describing what you want to accomplish and who you're looking for.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Need 2 developers for weekend hackathon"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Create a compelling title that clearly describes what you're recruiting for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your project in detail. What are you building? What makes it interesting? What will team members be working on?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of your project or goal. This helps potential team members understand what they'll be contributing to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Objective *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What specific outcome are you trying to achieve? What does success look like?"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Define the specific goal or deliverable you want to accomplish together.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <FormDescription>
                      {selectedCategory.description}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" className="flex items-center gap-2">
                Next: Requirements
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
