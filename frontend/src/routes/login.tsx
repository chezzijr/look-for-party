import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiMail } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Form, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"
import { emailPattern, passwordRules } from "@/utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/dashboard",
      })
    }
  },
})

function Login() {
  const { loginMutation, error, resetError } = useAuth()
  const form = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img
            src={Logo}
            alt="FastAPI logo"
            className="h-16 w-auto mx-auto mb-4"
          />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email</Label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="username"
                    {...register("username", {
                      required: "Username is required",
                      pattern: emailPattern,
                    })}
                    placeholder="Enter your email"
                    type="email"
                    className="pl-10"
                  />
                </div>
                {errors.username && (
                  <FormMessage>{errors.username.message}</FormMessage>
                )}
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    {...register("password", passwordRules())}
                    placeholder="Enter your password"
                    type="password"
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <FormMessage>{errors.password.message}</FormMessage>
                )}
              </div>

              <div className="text-right">
                <RouterLink
                  to="/recover-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </RouterLink>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Signing in..." : "Log In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <RouterLink
                  to="/signup"
                  className="text-primary hover:underline"
                >
                  Sign Up
                </RouterLink>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
