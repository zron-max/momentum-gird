import AuthForm from "@/components/Auth/AuthForm";
import { ThemeProvider } from "next-themes";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
    const { user, isLoading, status } = useAuth();
    if (status === "pending") return <Navigate to="/pending" replace />;
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthForm />
        </ThemeProvider>
    );
};

export default Auth;
