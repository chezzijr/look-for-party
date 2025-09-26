import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import { type ApiError, type UpdatePassword, UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"
import { PasswordInput } from "../ui/password-input"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const ChangePassword = () => {
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Password updated successfully.")
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold py-4">
        Change Password
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full md:w-96">
        <div className="space-y-2">
          <Label htmlFor="current_password">Current Password</Label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="current_password"
              {...register("current_password", passwordRules())}
              placeholder="Current Password"
              type="password"
              className="pl-10"
            />
          </div>
          {errors.current_password && (
            <p className="text-sm text-destructive">{errors.current_password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="new_password"
              {...register("new_password", passwordRules())}
              placeholder="New Password"
              type="password"
              className="pl-10"
            />
          </div>
          {errors.new_password && (
            <p className="text-sm text-destructive">{errors.new_password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm Password</Label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Confirm Password"
              type="password"
              className="pl-10"
            />
          </div>
          {errors.confirm_password && (
            <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        <Button
          variant="default"
          type="submit"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  )
}
export default ChangePassword
