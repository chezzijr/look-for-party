import { useQuery } from "@tanstack/react-query"
import { TagsService } from "@/client"
import type { TagsPublic, TagCategory } from "@/client"

interface TagSuggestionsParams {
  query: string
  category?: TagCategory
  limit?: number
}

export const useTagSuggestions = ({ query, category, limit = 10 }: TagSuggestionsParams) => {
  return useQuery<TagsPublic>({
    queryKey: ["tag-suggestions", query, category, limit],
    queryFn: () => TagsService.getTagSuggestions({
      q: query,
      category: category || null,
      limit,
    }),
    enabled: query.length >= 2, // Only search when user has typed at least 2 characters
  })
}

export default useTagSuggestions
