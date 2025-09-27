import { Link } from "@tanstack/react-router"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"

const UserMenu = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <div className="flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-testid="user-menu" variant="default" className="max-w-sm truncate">
            <FaUserAstronaut className="text-lg mr-2" />
            <span>{user?.full_name || "User"}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link to="settings" className="flex items-center gap-2 py-2 cursor-pointer">
              <FiUser className="text-lg" />
              <span className="flex-1">My Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 py-2 cursor-pointer"
          >
            <FiLogOut />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default UserMenu
