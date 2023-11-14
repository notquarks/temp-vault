import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "Arkivio",
//   description: "Temporary file sharing",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      {/* <ThemeProvider attribute="class"> */}
      <body className={`${inter.className} `}>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
      {/* </ThemeProvider> */}
    </html>
  );
}
