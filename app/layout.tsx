import "./globals.css";
import { Public_Sans } from "next/font/google";
import { ActiveLink } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Site-o-Matic</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="Site-o-Matic - Your automated site generation tool"
        />
        <meta property="og:title" content="Site-o-Matic" />
        <meta
          property="og:description"
          content="Site-o-Matic - Your automated site generation tool"
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Site-o-Matic" />
        <meta
          name="twitter:description"
          content="Site-o-Matic - Your automated site generation tool"
        />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <div className="bg-secondary grid grid-rows-[auto,1fr] h-[100dvh]">
            <div className="grid grid-cols-[1fr,auto] gap-2 p-4">
              <div className="flex gap-4 flex-col md:flex-row md:items-center">
                <h1 className="text-2xl font-bold text-foreground">
                  Site-o-Matic
                </h1>
                <nav className="flex gap-1 flex-col md:flex-row">
                  <ActiveLink href="/">Chat</ActiveLink>
                  <ActiveLink href="/structured_output">
                    Structured Output
                  </ActiveLink>
                  <ActiveLink href="/agents">Agents</ActiveLink>
                </nav>
              </div>
            </div>
            <div className="bg-background mx-4 relative grid rounded-t-2xl border border-input border-b-0">
              <div className="absolute inset-0">{children}</div>
            </div>
          </div>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}