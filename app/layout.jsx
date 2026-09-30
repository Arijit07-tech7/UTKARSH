import "./globals.css";

export const metadata = {
  title: "UTKARSH — Your Academic Command Center",
  description: "Premium academic companion for NIT IT-C.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
