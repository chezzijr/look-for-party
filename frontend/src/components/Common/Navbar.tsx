import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/fastapi-logo.svg"
import UserMenu from "./UserMenu"

function Navbar() {
  return (
    <nav className="hidden md:flex justify-between items-center sticky top-0 w-full p-4 bg-muted border-b">
      <Link to="/" className="flex items-center">
        <img src={Logo} alt="Logo" className="h-8 w-auto p-1" />
      </Link>
      <div className="flex gap-2 items-center">
        <UserMenu />
      </div>
    </nav>
  )
}

export default Navbar
