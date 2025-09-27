import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Calendar,
  Eye,
  Shield,
  Target,
  CheckCircle,
  Loader2
} from "lucide-react"
import type { QuestFormData } from "./QuestCreationWizard"

interface ReviewStepProps {
  data: QuestFormData
  onSubmit: () => Promise<void>
  onPrev: () => void
  isSubmitting: boolean
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "GAMING":
      return "bg-purple-100 text-purple-800"
    case "PROFESSIONAL":
      return "bg-blue-100 text-blue-800"
    case "SOCIAL":
      return "bg-green-100 text-green-800"
    case "LEARNING":
      return "bg-yellow-100 text-yellow-800"
    case "CREATIVE":
      return "bg-pink-100 text-pink-800"
    case "FITNESS":
      return "bg-orange-100 text-orange-800"
    case "TRAVEL":
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getCommitmentDescription = (level: string) => {
  switch (level) {
    case "CASUAL":
      return "Flexible schedule, few hours per week"
    case "MODERATE":
      return "Regular commitment, several hours per week"
    case "SERIOUS":
      return "Dedicated involvement, significant time investment"
    case "PROFESSIONAL":
      return "Full-time or high-stakes commitment"
    default:
      return level
  }
}

const getLocationDescription = (type: string, detail?: string | null) => {
  switch (type) {
    case "REMOTE":
      return "Remote work"
    case "IN_PERSON":
      return detail ? `In-person: ${detail}` : "In-person"
    case "HYBRID":
      return detail ? `Hybrid: ${detail}` : "Hybrid (remote + in-person)"
    default:
      return type
  }
}

const getVisibilityDescription = (visibility: string) => {
  switch (visibility) {
    case "PUBLIC":
      return "Anyone can see and apply"
    case "UNLISTED":
      return "Only those with link can see"
    case "PRIVATE":
      return "Invite only"
    default:
      return visibility
  }
}

export function ReviewStep({ data, onSubmit, onPrev, isSubmitting }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Review Your Quest
          </CardTitle>
          <CardDescription>
            Review all the details before publishing your quest. You can edit these later if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Details */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quest Overview
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-medium">{data.title}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className={getCategoryColor(data.category || "")}>
                    {data.category}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description:</p>
                <p className="text-sm">{data.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Objective:</p>
                <p className="text-sm">{data.objective}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Team Requirements */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Requirements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {data.party_size_min === data.party_size_max
                    ? `${data.party_size_min} members`
                    : `${data.party_size_min}-${data.party_size_max} members`}
                </span>
              </div>

              {data.requiredSkills && data.requiredSkills.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="default" className="bg-red-100 text-red-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.optionalSkills && data.optionalSkills.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nice-to-Have Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.optionalSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Logistics */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Logistics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {data.required_commitment} commitment
                  <span className="text-muted-foreground ml-1">
                    ({getCommitmentDescription(data.required_commitment || "")})
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{getLocationDescription(data.location_type || "", data.location_detail)}</span>
              </div>

              {data.starts_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Starts: {formatDate(data.starts_at)}</span>
                </div>
              )}

              {data.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {formatDate(data.deadline)}</span>
                </div>
              )}

              {data.estimated_duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {data.estimated_duration}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Quest Settings */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Quest Settings
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>
                  {data.visibility} - {getVisibilityDescription(data.visibility || "")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>
                  Applications will be {data.auto_approve ? "automatically approved" : "manually reviewed"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing Quest...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Publish Quest
            </>
          )}
        </Button>
      </div>

      {/* Success Message */}
      {isSubmitting && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <div>
                <p className="font-medium text-green-800">Publishing your quest...</p>
                <p className="text-sm text-green-600">
                  Your quest will be visible on the quest board once published.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
