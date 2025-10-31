import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header userType="CANDIDATE" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
