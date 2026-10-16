import type { ReactNode } from "react";

export const metadata = {
  title: "BiteVerse",
  description: "Order food from restaurants near you",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
