import { Link as RouterLink } from "@tanstack/react-router"
import { FiHome, FiSettings } from "react-icons/fi"
import { Search } from "lucide-react"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/dashboard" },
  { icon: Search, title: "Quests", path: "/quests" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const listItems = items.map(({ icon: Icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <div className="flex gap-4 px-4 py-2 hover:bg-muted items-center text-sm rounded-md">
        <Icon className="self-center h-4 w-4" />
        <span className="ml-2">{title}</span>
      </div>
    </RouterLink>
  ))

  return (
    <>
      <p className="text-xs px-4 py-2 font-bold text-muted-foreground">
        Menu
      </p>
      <div>{listItems}</div>
    </>
  )
}

export default SidebarItems
