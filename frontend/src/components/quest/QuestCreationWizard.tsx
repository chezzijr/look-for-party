import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BasicDetailsStep } from "./BasicDetailsStep"
import { RequirementsStep } from "./RequirementsStep"
import { LogisticsStep } from "./LogisticsStep"
import { ReviewStep } from "./ReviewStep"
import type { QuestCreate } from "@/client"

interface QuestCreationWizardProps {
  onSubmit: (questData: QuestCreate) => Promise<void>
  onCancel: () => void
}

export interface QuestFormData extends Partial<QuestCreate> {
  // Additional form state that might not be in the final API payload
  requiredSkills?: string[]
  optionalSkills?: string[]
}

const STEPS = [
  { id: 1, title: "Basic Details", description: "Quest title, description, and category" },
  { id: 2, title: "Requirements", description: "Skills needed and party size" },
  { id: 3, title: "Logistics", description: "Timeline, location, and commitment level" },
  { id: 4, title: "Review", description: "Review and publish your quest" },
]

export function QuestCreationWizard({ onSubmit, onCancel }: QuestCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<QuestFormData>({
    title: "",
    description: "",
    objective: "",
    category: "PROFESSIONAL",
    party_size_min: 2,
    party_size_max: 5,
    required_commitment: "MODERATE",
    location_type: "REMOTE",
    auto_approve: false,
    visibility: "PUBLIC",
    quest_type: "INDIVIDUAL",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (stepData: Partial<QuestFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Convert form data to API format
      const questData: QuestCreate = {
        title: formData.title!,
        description: formData.description!,
        objective: formData.objective!,
        category: formData.category!,
        party_size_min: formData.party_size_min!,
        party_size_max: formData.party_size_max!,
        required_commitment: formData.required_commitment!,
        location_type: formData.location_type!,
        location_detail: formData.location_detail || null,
        starts_at: formData.starts_at || null,
        deadline: formData.deadline || null,
        estimated_duration: formData.estimated_duration || null,
        auto_approve: formData.auto_approve,
        visibility: formData.visibility,
        quest_type: formData.quest_type,
      }

      await onSubmit(questData)
    } catch (error) {
      console.error("Failed to create quest:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicDetailsStep
            data={formData}
            onChange={updateFormData}
            onNext={nextStep}
          />
        )
      case 2:
        return (
          <RequirementsStep
            data={formData}
            onChange={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 3:
        return (
          <LogisticsStep
            data={formData}
            onChange={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 4:
        return (
          <ReviewStep
            data={formData}
            onSubmit={handleSubmit}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  const currentStepInfo = STEPS[currentStep - 1]
  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create New Quest</h1>
        <p className="text-muted-foreground">
          Find the perfect team members for your next adventure
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Step {currentStep} of {STEPS.length}: {currentStepInfo.title}
              </CardTitle>
              <CardDescription>{currentStepInfo.description}</CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <div className="flex justify-center space-x-4">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
              step.id === currentStep
                ? "bg-primary text-primary-foreground"
                : step.id < currentStep
                ? "bg-muted text-muted-foreground"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step.id === currentStep
                  ? "bg-primary-foreground text-primary"
                  : step.id < currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {step.id}
            </div>
            <span className="hidden sm:inline">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {renderStep()}
      </div>
    </div>
  )
}
