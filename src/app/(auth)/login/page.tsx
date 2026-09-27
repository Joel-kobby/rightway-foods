import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login — RightWay Foods" };

export default async function LoginPage() {
  // If already logged in, redirect to their dashboard
  const session = await auth();
  if (session?.user) {
    redirect(session.user.dashboardRoute ?? "/admin");
  }

  return (
    <main className="min-h-screen flex bg-[hsl(45,30%,96%)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-[hsl(142,71%,18%)] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-[hsl(43,89%,45%)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-white font-black text-3xl">R</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">RightWay Foods</h1>
          <p className="text-white/60 text-lg max-w-xs">
            Quality Ghanaian food products, delivered with care.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Palm Oil", icon: "🌴" },
              { label: "Coconut Oil", icon: "🥥" },
              { label: "Fresh Eggs", icon: "🥚" },
            ].map((p) => (
              <div key={p.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl mb-1">{p.icon}</p>
                <p className="text-white/70 text-xs font-medium">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[hsl(142,71%,25%)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-black text-2xl">R</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">RightWay Foods</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Staff Login</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to access your dashboard.</p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-gray-400 mt-6">
            RightWay Foods Staff Portal · Unauthorised access is prohibited.
          </p>
        </div>
      </div>
    </main>
  );
}
