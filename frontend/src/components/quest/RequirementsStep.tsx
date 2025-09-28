import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react"
import type { QuestFormData } from "./QuestCreationWizard"

const requirementsSchema = z.object({
  party_size_min: z.number().min(1, "Minimum party size must be at least 1").max(50, "Maximum 50 members"),
  party_size_max: z.number().min(1, "Maximum party size must be at least 1").max(50, "Maximum 50 members"),
}).refine((data) => data.party_size_max >= data.party_size_min, {
  message: "Maximum party size must be greater than or equal to minimum",
  path: ["party_size_max"],
})

type RequirementsFormData = z.infer<typeof requirementsSchema>

interface RequirementsStepProps {
  data: QuestFormData
  onChange: (data: Partial<QuestFormData>) => void
  onNext: () => void
  onPrev: () => void
}

// For now, we'll use a predefined list of common skills
// Later this can be replaced with TagsService.readTags() API call
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "Go", "Rust",
  "UI/UX Design", "Graphic Design", "Product Management", "Marketing", "Writing",
  "Data Analysis", "Machine Learning", "DevOps", "Mobile Development", "Testing",
  "Leadership", "Communication", "Project Management", "Research", "Strategy"
]

export function RequirementsStep({ data, onChange, onNext, onPrev }: RequirementsStepProps) {
  const [requiredSkills, setRequiredSkills] = useState<string[]>(data.requiredSkills || [])
  const [optionalSkills, setOptionalSkills] = useState<string[]>(data.optionalSkills || [])
  const [newSkill, setNewSkill] = useState("")
  const [skillType, setSkillType] = useState<"required" | "optional">("required")

  const form = useForm<RequirementsFormData>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: {
      party_size_min: data.party_size_min || 2,
      party_size_max: data.party_size_max || 5,
    },
  })

  const addSkill = (skill: string, type: "required" | "optional") => {
    const trimmedSkill = skill.trim()
    if (!trimmedSkill) return

    if (type === "required") {
      if (!requiredSkills.includes(trimmedSkill) && !optionalSkills.includes(trimmedSkill)) {
        setRequiredSkills([...requiredSkills, trimmedSkill])
      }
    } else {
      if (!optionalSkills.includes(trimmedSkill) && !requiredSkills.includes(trimmedSkill)) {
        setOptionalSkills([...optionalSkills, trimmedSkill])
      }
    }
    setNewSkill("")
  }

  const removeSkill = (skill: string, type: "required" | "optional") => {
    if (type === "required") {
      setRequiredSkills(requiredSkills.filter(s => s !== skill))
    } else {
      setOptionalSkills(optionalSkills.filter(s => s !== skill))
    }
  }

  const onSubmit = (values: RequirementsFormData) => {
    onChange({
      ...values,
      requiredSkills,
      optionalSkills,
    })
    onNext()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Requirements</CardTitle>
        <CardDescription>
          Define the skills you need and how many team members you're looking for.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Party Size */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="party_size_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Team Size *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum number of people needed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="party_size_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Team Size *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of people you want
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Required Skills */}
            <div className="space-y-3">
              <div>
                <FormLabel>Required Skills</FormLabel>
                <FormDescription>
                  Essential skills that team members must have
                </FormDescription>
              </div>

              {/* Skill Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Type a skill and press Enter"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill(newSkill, skillType)
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSkillType(skillType === "required" ? "optional" : "required")}
                  className={skillType === "required" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}
                >
                  {skillType === "required" ? "Required" : "Optional"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSkill(newSkill, skillType)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Common Skills */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Common skills (click to add):</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.filter(skill =>
                    !requiredSkills.includes(skill) && !optionalSkills.includes(skill)
                  ).map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => addSkill(skill, skillType)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Required Skills Display */}
              {requiredSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="default"
                        className="bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill, "required")}
                          className="ml-1 hover:bg-red-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Skills Display */}
              {optionalSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-2">Nice-to-Have Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {optionalSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="bg-blue-50 text-blue-800 hover:bg-blue-100"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill, "optional")}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onPrev} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                Next: Logistics
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
