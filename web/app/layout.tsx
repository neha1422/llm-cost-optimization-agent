import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme";
export const metadata: Metadata = {
  title: "ShopAssist AI — Cost Optimization Lab",
  description:
    "Intelligent Customer Support. Optimized for Accuracy and Cost. Explore measured Python agent performance.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('shopassist-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
