import type { ApiError } from "@/client"

interface ValidationError {
  type: string
  loc: (string | number)[]
  msg: string
  input?: any
  ctx?: Record<string, any>
}

interface ApiErrorResponse {
  detail: string | ValidationError[]
}

export function parseApiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred"
  }

  // Handle ApiError from the generated client
  if (error.name === "ApiError" && "body" in error) {
    const apiError = error as ApiError
    const errorBody = apiError.body as ApiErrorResponse

    // Handle validation errors (422)
    if (Array.isArray(errorBody.detail)) {
      return parseValidationErrors(errorBody.detail)
    }

    // Handle simple string errors (400, etc.)
    if (typeof errorBody.detail === "string") {
      return parseStringError(errorBody.detail)
    }
  }

  // Handle network errors
  if (error.message.includes("fetch") || error.message.includes("network")) {
    return "Unable to connect to the server. Please check your internet connection and try again."
  }

  // Default error message
  return error.message || "An unexpected error occurred"
}

function parseStringError(detail: string): string {
  // Map backend error messages to user-friendly messages
  const errorMap: Record<string, string> = {
    "Start date cannot be in the past": "Please select a start date that is today or in the future.",
    "Deadline must be after start date": "The deadline must be set after the start date.",
    "Minimum party size cannot be greater than maximum party size": "The minimum party size cannot be larger than the maximum party size.",
    "Quest not found": "The quest you're looking for could not be found.",
    "Not enough permissions": "You don't have permission to perform this action.",
    "User already applied to this quest": "You have already applied to this quest.",
  }

  return errorMap[detail] || detail
}

function parseValidationErrors(errors: ValidationError[]): string {
  // Group errors by field for better presentation
  const fieldErrors: Record<string, string[]> = {}

  for (const error of errors) {
    const fieldName = getFieldDisplayName(error.loc)
    const message = getValidationErrorMessage(error)

    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = []
    }
    fieldErrors[fieldName].push(message)
  }

  // Format the error messages
  const errorMessages = Object.entries(fieldErrors).map(([field, messages]) => {
    if (messages.length === 1) {
      return `${field}: ${messages[0]}`
    }
    return `${field}: ${messages.join(", ")}`
  })

  if (errorMessages.length === 1) {
    return errorMessages[0]
  }

  return `Please fix the following issues:\n• ${errorMessages.join("\n• ")}`
}

function getFieldDisplayName(location: (string | number)[]): string {
  // Convert API field names to user-friendly names
  const fieldMap: Record<string, string> = {
    title: "Quest Title",
    description: "Description",
    objective: "Objective",
    category: "Category",
    party_size_min: "Minimum Party Size",
    party_size_max: "Maximum Party Size",
    required_commitment: "Commitment Level",
    location_type: "Location Type",
    location_detail: "Location Details",
    starts_at: "Start Date",
    deadline: "Deadline",
    estimated_duration: "Estimated Duration",
    auto_approve: "Auto-approve Setting",
    visibility: "Visibility Setting",
  }

  // Get the field name from the location array (usually the last element)
  const fieldName = location[location.length - 1]?.toString() || "Field"
  return fieldMap[fieldName] || fieldName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function getValidationErrorMessage(error: ValidationError): string {
  const { type, msg, ctx } = error

  // Custom messages for common validation types
  switch (type) {
    case "string_too_short":
      if (ctx?.min_length) {
        return `must be at least ${ctx.min_length} characters long`
      }
      return "is too short"

    case "string_too_long":
      if (ctx?.max_length) {
        return `must be no more than ${ctx.max_length} characters long`
      }
      return "is too long"

    case "missing":
      return "is required"

    case "value_error":
      return "is not valid"

    case "type_error":
      return "has an invalid format"

    case "enum":
      if (ctx?.expected) {
        return `must be one of: ${ctx.expected.join(", ")}`
      }
      return "is not a valid option"

    case "greater_than":
      if (ctx?.gt !== undefined) {
        return `must be greater than ${ctx.gt}`
      }
      return "must be greater"

    case "greater_than_equal":
      if (ctx?.ge !== undefined) {
        return `must be at least ${ctx.ge}`
      }
      return "must be at least the minimum value"

    case "less_than":
      if (ctx?.lt !== undefined) {
        return `must be less than ${ctx.lt}`
      }
      return "must be less"

    case "less_than_equal":
      if (ctx?.le !== undefined) {
        return `must be no more than ${ctx.le}`
      }
      return "must be at most the maximum value"

    default:
      // Fallback to the original message, but make it more user-friendly
      return msg.toLowerCase().replace(/^./, char => char.toUpperCase())
  }
}
