import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface MetricsCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
}

export function MetricsCard({ title, value, description, icon: Icon }: MetricsCardProps) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <div className="p-2 bg-[#f0f4f8] rounded-full">
                    <Icon className="h-4 w-4 text-[#0095e0]" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {description && (
                    <p className="text-xs text-gray-500 mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
