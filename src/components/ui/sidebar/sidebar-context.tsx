import * as React from "react";

interface SidebarContextValue {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  toggleExpanded: () => void;
  isMobileView: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function SidebarProvider({
  children,
  defaultExpanded = true,
}: SidebarProviderProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobileView, setIsMobileView] = React.useState(false);

  // Check if we're on mobile screen size
  React.useEffect(() => {
    const checkMobileView = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
    };

    // Initial check
    checkMobileView();

    // Add resize listener
    window.addEventListener("resize", checkMobileView);

    // Clean up
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const toggleExpanded = React.useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const toggleOpen = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      expanded,
      setExpanded,
      toggleExpanded,
      isMobileView,
      isOpen,
      setIsOpen,
      toggleOpen,
    }),
    [expanded, toggleExpanded, isMobileView, isOpen, toggleOpen]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
