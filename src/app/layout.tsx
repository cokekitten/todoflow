import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TodoFlow",
  description: "Personal todo list with Telegram reminders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
