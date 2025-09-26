import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router"
import { FiArrowRight, FiTarget, FiUsers, FiZap } from "react-icons/fi"
import { IconType } from "react-icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"

export const Route = createFileRoute("/")({
  component: LandingPage,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/dashboard",
      })
    }
  },
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <img src={Logo} alt="Logo" className="h-8 mr-4" />
            <h1 className="text-xl font-semibold text-blue-500">
              Look For Party
            </h1>
          </div>
          <div className="flex gap-4">
            <Button asChild variant="ghost" size="sm">
              <RouterLink to="/login">Log In</RouterLink>
            </Button>
            <Button asChild variant="default" size="sm">
              <RouterLink to="/signup">Sign Up</RouterLink>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col gap-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
            Find Your Perfect{" "}
            <span className="text-blue-500">
              Collaboration Party
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Intent-first platform for quest-based collaboration. Start with what you want to accomplish,
            find the right party members to make it happen. No more endless scrolling - just purposeful connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <RouterLink to="/signup">
                Start Your Quest <FiArrowRight className="ml-2 h-4 w-4" />
              </RouterLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <RouterLink to="/login">Join Existing Party</RouterLink>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-3xl font-bold">
              How LFP Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Intent-first collaboration that connects the right people for the right quests
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={FiTarget}
              title="Quest-Based Discovery"
              description="Start with your objective, not who you know. Create or join quests based on what you want to accomplish."
            />
            <FeatureCard
              icon={FiZap}
              title="Smart Matching"
              description="Algorithm finds complementary skills, compatible schedules, and the right party size for your quest."
            />
            <FeatureCard
              icon={FiUsers}
              title="Temporary Teams"
              description="Form parties for specific quests, collaborate effectively, then rate and disband when complete."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col gap-8 text-center">
            <h2 className="text-3xl font-bold">
              Ready to Find Your Party?
            </h2>
            <p className="text-lg max-w-2xl mx-auto">
              Join the quest-based collaboration platform where objectives come first.
              Create your first quest or join an existing party today.
            </p>
            <Button asChild size="lg" variant="outline" className="bg-white text-blue-500 hover:bg-gray-50 mx-auto">
              <RouterLink to="/signup">
                Start Collaborating <FiArrowRight className="ml-2 h-4 w-4" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <img src={Logo} alt="Logo" className="h-6 mr-2" />
              <span className="text-sm">Look For Party</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 Look For Party. Intent-first quest-based collaboration.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: IconType
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="flex-1">
      <CardContent className="p-8">
        <div className="flex flex-col gap-4 items-start">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
