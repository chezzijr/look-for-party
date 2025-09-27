import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ApiError, type UpdatePassword, UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"

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
        <PasswordInput
          id="current_password"
          label="Current Password"
          {...register("current_password", passwordRules())}
          placeholder="Current Password"
          error={errors.current_password?.message}
        />

        <PasswordInput
          id="new_password"
          label="New Password"
          {...register("new_password", passwordRules())}
          placeholder="New Password"
          error={errors.new_password?.message}
        />

        <PasswordInput
          id="confirm_password"
          label="Confirm Password"
          {...register("confirm_password", confirmPasswordRules(getValues))}
          placeholder="Confirm Password"
          error={errors.confirm_password?.message}
        />

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
