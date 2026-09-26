export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#f4fbfd] dark:bg-slate-900">
            {children}
        </div>
    )
}
