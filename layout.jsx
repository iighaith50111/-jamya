import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata = {
  title: "دفتري — إدارة الجمعيات المالية",
  description: "تطبيق لإدارة الجمعيات المالية الدورية (ROSCA): المشتركين، الاشتراكات، أدوار الاستلام والتقارير.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="font-tajawal bg-[#F2F4EF] text-[#1E2A24]">
        {children}
      </body>
    </html>
  );
}
