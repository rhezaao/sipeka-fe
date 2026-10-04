import type { Metadata } from "next";
import { DemoProvider } from "@/components/demo-provider";
import { AuthProvider } from "@/components/auth-provider";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import "./globals.css";

export const metadata:Metadata={title:"SIPEKA · Prototipe JKN",description:"Prototipe interaktif SIPEKA dengan data fiktif untuk pekerja, perusahaan, dan petugas.",icons:{icon:"/icon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body><AuthProvider><DemoProvider>{children}</DemoProvider></AuthProvider></body></html>;}
