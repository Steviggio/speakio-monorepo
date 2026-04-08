import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
