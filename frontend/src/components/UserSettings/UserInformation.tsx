import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  type ApiError,
  type UserPublic,
  type UserUpdateMe,
  UsersService,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"

const UserInformation = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()
  const form = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = form

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
      setEditMode(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold py-4">
        User Information
      </h2>
      <Form {...form}>
        <form
          className="w-full md:w-96"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            {editMode ? (
              <>
                <Input
                  id="full_name"
                  {...register("full_name", { maxLength: 30 })}
                  type="text"
                />
                {errors.full_name && (
                  <FormMessage>{errors.full_name.message}</FormMessage>
                )}
              </>
            ) : (
              <p className="text-sm py-2 text-muted-foreground truncate max-w-sm">
                {currentUser?.full_name || "N/A"}
              </p>
            )}
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="email">Email</Label>
            {editMode ? (
              <>
                <Input
                  id="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: emailPattern,
                  })}
                  type="email"
                />
                {errors.email && (
                  <FormMessage>{errors.email.message}</FormMessage>
                )}
              </>
            ) : (
              <p className="text-sm py-2 truncate max-w-sm">
                {currentUser?.email}
              </p>
            )}
          </div>

          <div className="flex mt-4 gap-3">
            {editMode ? (
              <Button
                variant="default"
                type="submit"
                disabled={isSubmitting || !isDirty || !getValues("email")}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            ) : (
              <Button
                variant="default"
                type="button"
                onClick={toggleEditMode}
              >
                Edit
              </Button>
            )}
            {editMode && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

export default UserInformation
