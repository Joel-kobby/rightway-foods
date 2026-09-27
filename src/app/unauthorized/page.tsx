import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[hsl(142,71%,25%)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
