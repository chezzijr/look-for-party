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
import { FiArrowRight, FiShield, FiUsers, FiZap } from "react-icons/fi"

import { Button } from "@/components/ui/button"

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
    <Box minH="100vh" bg="gray.subtle">
      {/* Header */}
      <Container maxW="7xl" px={4}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <Flex alignItems="center">
            <Image src={Logo} alt="Logo" height={8} mr={4} />
            <Heading size="lg" color="blue.500">
              FastAPI Template
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
            Build Modern Web Applications with{" "}
            <Text as="span" color="blue.500">
              FastAPI & React
            </Text>
          </Heading>
          <Text fontSize="xl" color="gray.subtle" maxW="2xl">
            A comprehensive full-stack template featuring FastAPI backend, React
            frontend, authentication, and modern developer tools. Get started in
            minutes, not hours.
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} gap={4}>
            <Button asChild variant="solid" size="lg">
              <RouterLink to="/signup">
                Get Started Free <FiArrowRight />
              </RouterLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <RouterLink to="/login">Sign In</RouterLink>
            </Button>
          </Stack>
        </VStack>
      </Container>

      {/* Features Section */}
      <Container maxW="7xl" px={4} py={20}>
        <VStack gap={12}>
          <VStack gap={4} textAlign="center">
            <Heading as="h2" size="xl">
              Everything You Need
            </Heading>
            <Text fontSize="lg" color="gray.subtle" maxW="2xl">
              Built with industry best practices and modern technologies
            </Text>
          </VStack>
          
          <Flex
            gap={8}
            direction={{ base: "column", md: "row" }}
            align="stretch"
          >
            <FeatureCard
              icon={FiZap}
              title="Fast Development"
              description="Hot reload, automatic API generation, and modern tooling for rapid development cycles."
            />
            <FeatureCard
              icon={FiShield}
              title="Secure by Default"
              description="Built-in authentication, password hashing, and security best practices out of the box."
            />
            <FeatureCard
              icon={FiUsers}
              title="User Management"
              description="Complete user registration, login, password recovery, and profile management system."
            />
          </Flex>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="blue.500" color="white">
        <Container maxW="7xl" px={4} py={20}>
          <VStack gap={8} textAlign="center">
            <Heading as="h2" size="xl">
              Ready to Get Started?
            </Heading>
            <Text fontSize="lg" maxW="2xl">
              Join developers building modern applications with our template.
              Create your account and start building today.
            </Text>
            <Button asChild size="lg" bg="white" color="blue.500" _hover={{ bg: "gray.50" }}>
              <RouterLink to="/signup">
                Create Account <FiArrowRight />
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
              <Text fontSize="sm">FastAPI Template</Text>
            </Flex>
            <Text fontSize="sm" color="gray.400">
              © 2024 FastAPI Template. Built with FastAPI & React.
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType
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