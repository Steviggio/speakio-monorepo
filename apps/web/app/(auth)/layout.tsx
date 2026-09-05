import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link
            href="/"
            className="text-xl font-bold text-text tracking-tight"
          >
            speakio
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
