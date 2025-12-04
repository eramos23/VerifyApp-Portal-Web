import { LoginForm } from "@/components/auth/LoginForm"

export default function AdminLoginPage() {
    return (
        <LoginForm
            role="admin"
            title="Administrador"
            description="Ingresa tus credenciales de administrador"
            allowedRoles={["admin"]}
        />
    )
}
