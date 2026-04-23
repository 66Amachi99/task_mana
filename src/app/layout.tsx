import "./globals.css";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full">
      <body className="antialiased h-full overflow-x-hidden">
        {/* Оставляем только глобальные провайдеры */}
        <Providers>
           {children}
        </Providers>
      </body>
    </html>
  );
}