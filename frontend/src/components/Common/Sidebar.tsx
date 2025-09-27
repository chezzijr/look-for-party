import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FaBars } from "react-icons/fa"
import { FiLogOut } from "react-icons/fi"

import type { UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import SidebarItems from "./SidebarItems"

const Sidebar = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="flex md:hidden absolute z-[100] m-4"
            aria-label="Open Menu"
          >
            <FaBars />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <div className="flex flex-col justify-between h-full">
            <div>
              <SidebarItems onClose={() => setOpen(false)} />
              <button
                onClick={() => {
                  logout()
                }}
                className="flex items-center gap-4 px-4 py-2 w-full text-left hover:bg-accent rounded-md"
              >
                <FiLogOut />
                <span>Log Out</span>
              </button>
            </div>
            {currentUser?.email && (
              <div className="mt-auto">
                <p className="text-sm p-2 truncate max-w-sm text-muted-foreground">
                  Logged in as: {currentUser.email}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <div className="hidden md:flex sticky bg-muted top-0 min-w-[20rem] h-screen p-4">
        <div className="w-full">
          <SidebarItems />
        </div>
      </div>
    </>
  )
}

export default Sidebar
