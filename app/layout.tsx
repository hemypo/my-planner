import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Подключаем шрифт Inter
const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Финансовый Планер",
  description: "Мой личный дашборд для учета бюджета",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* Применяем шрифт ко всему приложению */}
      <body className={inter.className}>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}