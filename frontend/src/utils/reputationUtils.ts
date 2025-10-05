/**
 * Get color class for reputation score
 */
export const getReputationColor = (score: number): string => {
  if (score >= 4.5) {
    return "bg-green-50 text-green-700 border-green-200"
  }
  if (score >= 3.5) {
    return "bg-blue-50 text-blue-700 border-blue-200"
  }
  if (score >= 2.5) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200"
  }
  return "bg-red-50 text-red-700 border-red-200"
}
