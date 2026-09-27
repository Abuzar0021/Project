import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/account";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const signedIn = (await cookies()).has(SESSION_COOKIE);
  return (
    <div className="site">
      <Nav signedIn={signedIn} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
