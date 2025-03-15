import React, { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PDFSidebar from "@/components/PDFSidebar";
import NetworkStatus from "@/components/NetworkStatus";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  const [isDark, setIsDark] = useState(false); // Initialize with a default value

  useEffect(() => {
    // Initialize the dark mode state
    const htmlElement = document.querySelector("html");
    const isDarkMode = htmlElement?.classList.contains("dark") || false;
    setIsDark(isDarkMode);

    // Listen for theme changes
    const handleThemeChange = (e: CustomEvent<{ isDark: boolean }>) => {
      setIsDark(e.detail.isDark);
    };

    window.addEventListener("themeChanged", handleThemeChange as EventListener);

    return () => {
      window.removeEventListener(
        "themeChanged",
        handleThemeChange as EventListener
      );
    };
  }, []);

  return (
    <SidebarProvider>
      <div
        className={`min-h-screen flex flex-col bg-background w-full transition-colors duration-200`}
      >
        <Header />
        <div className="flex flex-1 overflow-hidden relative">
          <PDFSidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="fixed top-16 left-2 z-20 md:hidden">
              <SidebarTrigger />
            </div>
            <div className="fixed top-16 right-4 z-20">
              <NetworkStatus />
            </div>
            <div className="flex-1 overflow-auto">{children}</div>
          </main>
        </div>
        {!hideFooter && <Footer />}
      </div>
    </SidebarProvider>
  );
};

export default Layout;
