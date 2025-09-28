import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Search } from "lucide-react"
import { Link } from "@tanstack/react-router"

export function EmptyParties() {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>No parties yet</CardTitle>
        <CardDescription>
          You're not in any parties yet. Join or create a quest to start collaborating with others!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/quests">
            <Search className="mr-2 h-4 w-4" />
            Browse Quests
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
