import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router"
import { FiArrowRight, FiTarget, FiUsers, FiZap } from "react-icons/fi"

import { Button } from "@/components/ui/button"

import { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"
import { IconType } from "react-icons"

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
    <Box minH="100vh" bg="gray.subtle">
      {/* Header */}
      <Container maxW="7xl" px={4}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <Flex alignItems="center">
            <Image src={Logo} alt="Logo" height={8} mr={4} />
            <Heading size="lg" color="blue.500">
              Look For Party
            </Heading>
          </Flex>
          <Stack direction="row" gap={4}>
            <Button asChild variant="ghost" size="sm">
              <RouterLink to="/login">Log In</RouterLink>
            </Button>
            <Button asChild variant="solid" size="sm">
              <RouterLink to="/signup">Sign Up</RouterLink>
            </Button>
          </Stack>
        </Flex>
      </Container>

      {/* Hero Section */}
      <Container maxW="7xl" px={4} py={20}>
        <VStack gap={8} textAlign="center">
          <Heading
            as="h1"
            size="2xl"
            maxW="4xl"
            lineHeight={1.2}
            fontWeight="bold"
          >
            Find Your Perfect{" "}
            <Text as="span" color="blue.500">
              Collaboration Party
            </Text>
          </Heading>
          <Text fontSize="xl" color="gray.subtle" maxW="2xl">
            Intent-first platform for quest-based collaboration. Start with what you want to accomplish,
            find the right party members to make it happen. No more endless scrolling - just purposeful connections.
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} gap={4}>
            <Button asChild variant="solid" size="lg">
              <RouterLink to="/signup">
                Start Your Quest <FiArrowRight />
              </RouterLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <RouterLink to="/login">Join Existing Party</RouterLink>
            </Button>
          </Stack>
        </VStack>
      </Container>

      {/* Features Section */}
      <Container maxW="7xl" px={4} py={20}>
        <VStack gap={12}>
          <VStack gap={4} textAlign="center">
            <Heading as="h2" size="xl">
              How LFP Works
            </Heading>
            <Text fontSize="lg" color="gray.subtle" maxW="2xl">
              Intent-first collaboration that connects the right people for the right quests
            </Text>
          </VStack>

          <Flex
            gap={8}
            direction={{ base: "column", md: "row" }}
            align="stretch"
          >
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
          </Flex>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="blue.500" color="white">
        <Container maxW="7xl" px={4} py={20}>
          <VStack gap={8} textAlign="center">
            <Heading as="h2" size="xl">
              Ready to Find Your Party?
            </Heading>
            <Text fontSize="lg" maxW="2xl">
              Join the quest-based collaboration platform where objectives come first.
              Create your first quest or join an existing party today.
            </Text>
            <Button asChild size="lg" bg="white" color="blue.500" _hover={{ bg: "gray.50" }}>
              <RouterLink to="/signup">
                Start Collaborating <FiArrowRight />
              </RouterLink>
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.800" color="white" py={8}>
        <Container maxW="7xl" px={4}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            gap={4}
          >
            <Flex alignItems="center">
              <Image src={Logo} alt="Logo" height={6} mr={2} />
              <Text fontSize="sm">Look For Party</Text>
            </Flex>
            <Text fontSize="sm" color="gray.400">
              © 2024 Look For Party. Intent-first quest-based collaboration.
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

interface FeatureCardProps {
  icon: IconType
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Box
      bg="white"
      p={8}
      rounded="lg"
      shadow="md"
      borderWidth="1px"
      flex="1"
    >
      <VStack gap={4} align="start">
        <Box
          p={3}
          bg="blue.50"
          rounded="lg"
          color="blue.500"
        >
          <Icon />
        </Box>
        <Heading size="md">{title}</Heading>
        <Text color="gray.subtle">{description}</Text>
      </VStack>
    </Box>
  )
}
