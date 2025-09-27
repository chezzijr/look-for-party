/**
 * Shared formatting and styling utilities for the application.
 * Centralizes color schemes, date formatting, and other display logic.
 */

/**
 * Maps quest categories to Tailwind CSS color classes for badges.
 * @param category - Quest category enum value
 * @returns Tailwind CSS classes for background and text color
 */
export function getCategoryColor(category: string): string {
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

/**
 * Maps quest statuses to Tailwind CSS color classes for badges.
 * @param status - Quest status enum value
 * @returns Tailwind CSS classes for background and text color
 */
export function getQuestStatusColor(status: string): string {
  switch (status) {
    case "RECRUITING":
      return "bg-green-100 text-green-800"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800"
    case "COMPLETED":
      return "bg-gray-100 text-gray-800"
    case "CANCELLED":
      return "bg-red-100 text-red-800"
    case "EXPIRED":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Maps party statuses to Tailwind CSS color classes for badges.
 * @param status - Party status enum value
 * @returns Tailwind CSS classes for background and text color
 */
export function getPartyStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800"
    case "COMPLETED":
      return "bg-blue-100 text-blue-800"
    case "ARCHIVED":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Formats a date string to a localized date representation.
 * @param dateString - ISO date string or null
 * @returns Formatted date string or null if input is null/undefined
 */
export function formatDate(dateString: string | null): string | null {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString()
}

/**
 * Formats a date string to a localized date and time representation.
 * Used for detailed displays like quest review.
 * @param dateString - ISO date string or null
 * @returns Formatted date and time string or null if input is null/undefined
 */
export function formatDateWithTime(dateString: string | null): string | null {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formats an ISO date string for use in HTML datetime-local input fields.
 * @param isoString - ISO date string or null
 * @returns Formatted string for datetime-local input or empty string if null
 */
export function formatDateForInput(isoString: string | null): string {
  if (!isoString) return ""

  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ""

    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ""
  }
}
