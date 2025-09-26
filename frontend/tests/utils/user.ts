import { type Page, expect } from "@playwright/test"

export async function signUpNewUser(
  page: Page,
  name: string,
  email: string,
  password: string,
) {
  await page.goto("/signup")

  await page.getByPlaceholder("Enter your full name").fill(name)
  await page.getByPlaceholder("Enter your email").fill(email)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByPlaceholder("Confirm your password").fill(password)
  await page.getByRole("button", { name: "Sign Up" }).click()
  await page.goto("/login")
}

export async function logInUser(page: Page, email: string, password: string) {
  await page.goto("/login")

  await page.getByPlaceholder("Enter your email").fill(email)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/dashboard")
  await expect(
    page.getByText("Welcome back, nice to see you again!"),
  ).toBeVisible()
}

export async function logOutUser(page: Page) {
  await page.getByTestId("user-menu").click()
  await page.getByText("Log Out").click()
  await page.goto("/login")
}
