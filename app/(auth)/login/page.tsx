"use client"

import Image from "next/image"
import Link from "next/link"
import { ShieldCheck, Radio, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { useEffect } from "react"

export default function LoginPage() {
    const { setIsLoading } = useLoadingStore()

    useEffect(() => {
        setIsLoading(false)
    }, [setIsLoading])

    const handleCardClick = () => {
        setIsLoading(true)
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg px-4 py-4 mx-auto">
            {/* Header Section */}
            <div className="flex flex-col items-center mb-6 text-center space-y-2">
                <div className="relative w-24 h-24 mb-1">
                    <Image
                        src="/logo.png"
                        alt="VerifyApp Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    VerifyApp <span className="text-[#0095e0]">Monitor</span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm">
                    Selecciona tu modalidad para continuar
                </p>
            </div>

            {/* Compact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Admin Card */}
                <Link
                    href="/login/admin"
                    onClick={handleCardClick}
                    className="group focus:outline-none"
                >
                    <Card className="border border-slate-200 shadow-md hover:shadow-xl transition-all duration-200 group-hover:-translate-y-0.5 bg-white relative overflow-hidden group-hover:border-[#0095e0]/50 p-4">
                        <CardContent className="p-0 flex flex-col items-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0095e0] group-hover:bg-[#0095e0] group-hover:text-white transition-colors duration-200 shadow-sm">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-[#007bb8] text-[10px] font-bold uppercase tracking-wider">
                                    Admin
                                </span>
                                <h2 className="text-base font-bold text-slate-800 group-hover:text-[#0095e0] transition-colors">
                                    Ingresar como Admin
                                </h2>
                            </div>
                            <div className="flex items-center text-xs font-semibold text-[#0095e0] pt-1">
                                <span>Acceder</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Ayudante Card */}
                <Link
                    href="/login/ayudante"
                    onClick={handleCardClick}
                    className="group focus:outline-none"
                >
                    <Card className="border border-slate-200 shadow-md hover:shadow-xl transition-all duration-200 group-hover:-translate-y-0.5 bg-white relative overflow-hidden group-hover:border-emerald-500/50 p-4">
                        <CardContent className="p-0 flex flex-col items-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shadow-sm">
                                <Radio className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                    Ayudante
                                </span>
                                <h2 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                    Ingresar como Ayudante
                                </h2>
                            </div>
                            <div className="flex items-center text-xs font-semibold text-emerald-600 pt-1">
                                <span>Acceder</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
