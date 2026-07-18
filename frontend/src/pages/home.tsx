import { Show, UserButton } from "@clerk/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div>
            <h1 className="text-amber-900">Home</h1>
            <Show when="signed-out">
                <Link to="/login">LogIn</Link>
                <Link to="/signup">SignUp</Link>
            </Show>
            <Show when="signed-in">
                <UserButton />
            </Show>
            <div className="flex min-h-svh flex-col items-center justify-center">
                <Button>Click me</Button>
            </div>
        </div>
    );
}
