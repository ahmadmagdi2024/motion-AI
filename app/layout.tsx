import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOTION AI v3 — استوديو الموشن جرافيك السينمائي",
  description: "توليد فيديوهات موشن جرافيك إعلانية فائقة الدقة والاحترافية تضاهي After Effects باستخدام الذكاء الاصطناعي وهندسة الحركة الدقيقة",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
