"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      closeButton={true}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="h-6 w-6 text-white shrink-0" />,
        info: <InfoIcon className="h-6 w-6 text-white shrink-0" />,
        warning: <TriangleAlertIcon className="h-6 w-6 text-white shrink-0" />,
        error: <OctagonXIcon className="h-6 w-6 text-white shrink-0" />,
        loading: <Loader2Icon className="h-6 w-6 text-white animate-spin shrink-0" />,
      }}
      toastOptions={{
        style: {
          minWidth: "360px",
          padding: "16px 20px",
          fontSize: "1rem",
        },
        classNames: {
          toast: "!rounded-2xl !shadow-2xl !p-4 !gap-3 !items-center !text-base !font-medium group-[.toaster]:!border-none",
          title: "!text-base !font-semibold",
          description: "!text-sm",
          success: "!bg-[#0095e0] !text-white !border-none",
          error: "!bg-[#d94848] !text-white !border-none",
          info: "!bg-sky-600 !text-white !border-none",
          warning: "!bg-amber-600 !text-white !border-none",
          closeButton: "!w-8 !h-8 !bg-white !text-slate-800 hover:!bg-slate-100 !border-2 !border-slate-300/80 !rounded-full !flex !items-center !justify-center !font-bold !text-sm !shadow-md hover:!scale-110 !transition-transform !cursor-pointer",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
