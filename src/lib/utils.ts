import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
    // Add custom class groups if needed for v4
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
