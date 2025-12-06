"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoveLeft, HelpCircle } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">

                {/* Abstract 404 Illustration */}
                <div className="relative h-64 w-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-3xl animate-pulse"></div>
                    <h1 className="text-9xl font-black text-[#0095e0] opacity-10 select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HelpCircle className="w-32 h-32 text-[#0095e0] animate-bounce" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Página No Encontrada
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Lo sentimos, la página que estás buscando no existe o ha sido movida.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                        asChild
                        className="bg-[#0095e0] hover:bg-[#007bb8] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        <Link href="/">
                            <MoveLeft className="mr-2 h-5 w-5" />
                            Volver al Inicio
                        </Link>
                    </Button>
                </div>

            </div>

            <div className="absolute bottom-8 text-gray-400 text-sm">
                © {new Date().getFullYear()} VerifyApp
            </div>
        </div>
    )
}
