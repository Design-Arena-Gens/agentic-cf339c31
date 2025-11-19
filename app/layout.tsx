import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente WhatsApp - Consult?rio Odontol?gico",
  description:
    "Agente de agendamento via WhatsApp para consult?rio de dentista, com painel administrativo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
