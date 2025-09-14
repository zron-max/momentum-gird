import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PendingPage() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate("/dashboard");
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1>Your account is pending approval</h1>
            <p>Please wait until an admin approves your account.</p>
            <Button
                onClick={handleSignOut}
                className="cursor-pointer text-destructive"
            >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
            </Button>
        </div>
    );
}
