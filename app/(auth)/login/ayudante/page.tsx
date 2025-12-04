import { LoginForm } from "@/components/auth/LoginForm"

export default function AyudanteLoginPage() {
    return (
        <LoginForm
            role="ayudante"
            title="Ayudante"
            description="Ingresa con tu número de teléfono"
            allowedRoles={["ayudante"]}
        />
    )
}
