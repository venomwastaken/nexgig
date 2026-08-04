import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Shared shell for every route rendered inside it.
 * <Outlet /> is where react-router injects whichever child route matched —
 * this is the react-router equivalent of Next.js's layout.tsx + {children}.
 */
export default function Layout() {
    return (
        <div className="flex min-h-screen flex-col bg-[#0B0B0B]">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
