import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold py-4">
        Delete Account
      </h2>
      <p className="text-muted-foreground mb-4">
        Permanently delete your data and everything associated with your
        account.
      </p>
      <DeleteConfirmation />
    </div>
  )
}
export default DeleteAccount
