import { useTheme } from "next-themes"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const Appearance = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold py-4">
        Appearance
      </h2>

      <RadioGroup
        value={theme}
        onValueChange={setTheme}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="system" id="system" />
          <Label htmlFor="system">System</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light">Light Mode</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark">Dark Mode</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
export default Appearance
