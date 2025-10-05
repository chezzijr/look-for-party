import type { UserTagPublic, QuestTagPublic, ProficiencyLevel } from "@/client"

export interface SkillMatchResult {
  overallScore: number
  requiredSkillsScore: number
  optionalSkillsScore: number
  matchedRequired: QuestTagPublic[]
  matchedOptional: QuestTagPublic[]
  missingRequired: QuestTagPublic[]
  missingOptional: QuestTagPublic[]
}

export interface SkillGap {
  tag: QuestTagPublic
  isRequired: boolean
  requiredProficiency: ProficiencyLevel | null
}

export interface PerfectMatch {
  questTag: QuestTagPublic
  userTag: UserTagPublic
  proficiencyMatch: boolean
}

/**
 * Calculate proficiency level score for weighting
 */
const getProficiencyScore = (proficiency: ProficiencyLevel | null | undefined): number => {
  if (!proficiency) return 0
  const scores: Record<ProficiencyLevel, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  }
  return scores[proficiency] || 0
}

/**
 * Calculate comprehensive skill match score between user tags and quest tags
 */
export const calculateSkillMatchScore = (
  userTags: UserTagPublic[],
  questTags: QuestTagPublic[]
): SkillMatchResult => {
  const requiredTags = questTags.filter((qt) => qt.is_required)
  const optionalTags = questTags.filter((qt) => !qt.is_required)

  // Create a map of user's tag IDs for quick lookup
  const userTagMap = new Map(userTags.map((ut) => [ut.tag_id, ut]))

  // Calculate required skills match
  const matchedRequired: QuestTagPublic[] = []
  const missingRequired: QuestTagPublic[] = []

  for (const questTag of requiredTags) {
    const userTag = userTagMap.get(questTag.tag_id)
    if (userTag) {
      // Check if proficiency meets minimum requirement
      const userProf = getProficiencyScore(userTag.proficiency_level)
      const requiredProf = getProficiencyScore(questTag.min_proficiency)

      if (userProf >= requiredProf) {
        matchedRequired.push(questTag)
      } else {
        missingRequired.push(questTag)
      }
    } else {
      missingRequired.push(questTag)
    }
  }

  // Calculate optional skills match
  const matchedOptional: QuestTagPublic[] = []
  const missingOptional: QuestTagPublic[] = []

  for (const questTag of optionalTags) {
    const userTag = userTagMap.get(questTag.tag_id)
    if (userTag) {
      const userProf = getProficiencyScore(userTag.proficiency_level)
      const requiredProf = getProficiencyScore(questTag.min_proficiency)

      if (userProf >= requiredProf) {
        matchedOptional.push(questTag)
      } else {
        missingOptional.push(questTag)
      }
    } else {
      missingOptional.push(questTag)
    }
  }

  // Calculate scores
  const requiredSkillsScore =
    requiredTags.length > 0
      ? (matchedRequired.length / requiredTags.length) * 100
      : 100 // If no required skills, assume 100%

  const optionalSkillsScore =
    optionalTags.length > 0
      ? (matchedOptional.length / optionalTags.length) * 100
      : 0

  // Overall score: 70% weight on required skills, 30% on optional
  const overallScore = requiredSkillsScore * 0.7 + optionalSkillsScore * 0.3

  return {
    overallScore: Math.round(overallScore),
    requiredSkillsScore: Math.round(requiredSkillsScore),
    optionalSkillsScore: Math.round(optionalSkillsScore),
    matchedRequired,
    matchedOptional,
    missingRequired,
    missingOptional,
  }
}

/**
 * Get skill gaps - skills the applicant is missing or has insufficient proficiency
 */
export const getSkillGaps = (
  userTags: UserTagPublic[],
  questTags: QuestTagPublic[]
): SkillGap[] => {
  const gaps: SkillGap[] = []
  const userTagMap = new Map(userTags.map((ut) => [ut.tag_id, ut]))

  for (const questTag of questTags) {
    const userTag = userTagMap.get(questTag.tag_id)

    if (!userTag) {
      // User doesn't have this skill at all
      gaps.push({
        tag: questTag,
        isRequired: questTag.is_required || false,
        requiredProficiency: questTag.min_proficiency || null,
      })
    } else {
      // Check if proficiency is insufficient
      const userProf = getProficiencyScore(userTag.proficiency_level)
      const requiredProf = getProficiencyScore(questTag.min_proficiency)

      if (userProf < requiredProf) {
        gaps.push({
          tag: questTag,
          isRequired: questTag.is_required || false,
          requiredProficiency: questTag.min_proficiency || null,
        })
      }
    }
  }

  return gaps
}

/**
 * Get perfect matches - skills where user meets or exceeds quest requirements
 */
export const getPerfectMatches = (
  userTags: UserTagPublic[],
  questTags: QuestTagPublic[]
): PerfectMatch[] => {
  const matches: PerfectMatch[] = []
  const userTagMap = new Map(userTags.map((ut) => [ut.tag_id, ut]))

  for (const questTag of questTags) {
    const userTag = userTagMap.get(questTag.tag_id)

    if (userTag) {
      const userProf = getProficiencyScore(userTag.proficiency_level)
      const requiredProf = getProficiencyScore(questTag.min_proficiency)

      if (userProf >= requiredProf) {
        matches.push({
          questTag,
          userTag,
          proficiencyMatch: userProf === requiredProf,
        })
      }
    }
  }

  return matches
}

/**
 * Get color for match score visualization
 */
export const getMatchScoreColor = (score: number): string => {
  if (score >= 75) {
    return "text-green-600 bg-green-50 border-green-200"
  }
  if (score >= 50) {
    return "text-yellow-600 bg-yellow-50 border-yellow-200"
  }
  return "text-red-600 bg-red-50 border-red-200"
}

/**
 * Get proficiency level label with color
 */
export const getProficiencyLabel = (level: ProficiencyLevel | null | undefined): string => {
  if (!level) return "Not Specified"
  const labels: Record<ProficiencyLevel, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    EXPERT: "Expert",
  }
  return labels[level] || "Not Specified"
}

/**
 * Get proficiency level color
 */
export const getProficiencyColor = (level: ProficiencyLevel | null | undefined): string => {
  if (!level) return "bg-gray-100 text-gray-600"
  const colors: Record<ProficiencyLevel, string> = {
    BEGINNER: "bg-blue-100 text-blue-700",
    INTERMEDIATE: "bg-purple-100 text-purple-700",
    ADVANCED: "bg-orange-100 text-orange-700",
    EXPERT: "bg-red-100 text-red-700",
  }
  return colors[level] || "bg-gray-100 text-gray-600"
}
