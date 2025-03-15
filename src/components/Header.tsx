import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { toggleTheme, setZoomLevel } from "@/lib/pdfUtils";
import { exportToFormat, ExportFormat } from "@/lib/pdfUtils/exportUtils";
import SettingsMenu from '@/components/menus/SettingsMenu';
import MainMenu from '@/components/menus/MainMenu';
import HelpDialog from '@/components/dialogs/HelpDialog';
import AboutDialog from '@/components/dialogs/AboutDialog';
import { Badge } from '@/components/ui/badge';

const Header: React.FC = () => {
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [zoomLevel, setZoomLevelState] = useState(1);
  const [isDark, setIsDark] = useState(true); // Initialize as true since we default to dark theme
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const htmlElement = document.querySelector('html');
    setIsDark(htmlElement?.classList.contains('dark') || false);
    
    const initialZoom = parseFloat(document.body.style.zoom || '1');
    setZoomLevelState(initialZoom);

    // Add online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleThemeToggle = () => {
    const newIsDark = toggleTheme();
    setIsDark(newIsDark);
    toast.success(newIsDark ? "Dark theme activated" : "Light theme activated");
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 2.0);
    setZoomLevel(newZoom);
    setZoomLevelState(newZoom);
    toast.success(`Zoomed in to ${Math.round(newZoom * 100)}%`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.3);
    setZoomLevel(newZoom);
    setZoomLevelState(newZoom);
    toast.success(`Zoomed out to ${Math.round(newZoom * 100)}%`);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setZoomLevelState(1);
    toast.success("Zoom reset to 100%");
  };

  const handleExport = (format: ExportFormat = 'pdf') => {
    const pdfIframe = document.querySelector('iframe[src$=".pdf"]') as HTMLIFrameElement;
    const pdfUrl = pdfIframe?.src;
    
    exportToFormat(pdfUrl, format);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Preparing document for printing...");
  };

  const handleHelp = () => {
    setShowHelpDialog(true);
  };

  const handleAbout = () => {
    setShowAboutDialog(true);
  };

  return (
    <header className="w-full h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md z-20 animate-fade-in">
      <div className="flex items-center">
        <Link to="/" className="flex items-center group transition-all duration-300 hover:scale-[1.02]">
          <div className="relative">
            <FileText className="w-8 h-8 text-[#9b87f5] dark:text-[#8B5CF6] transform transition-all duration-300 group-hover:rotate-[-5deg]" />
            <div className="absolute inset-0 bg-[#9b87f5]/20 dark:bg-[#8B5CF6]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="flex flex-col ml-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-foreground bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] dark:from-[#8B5CF6] dark:to-[#D946EF] bg-clip-text text-transparent">PDFlexo</h1>
              <Badge variant="outline" className="bg-[#D946EF]/10 text-[#D946EF] border-[#D946EF]/30 text-xs font-medium py-0 px-1.5">BETA</Badge>
              <div className="flex items-center ml-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} mr-1`}></div>
                <span className="text-xs text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">The Modern Free & Open-Source PDF Editor and Reader for All Users!</p>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <SettingsMenu 
          isDark={isDark}
          zoomLevel={zoomLevel}
          onThemeToggle={handleThemeToggle}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
        
        <MainMenu
          onExport={handleExport}
          onPrint={handlePrint}
          onHelp={handleHelp}
          onAbout={handleAbout}
        />
      </div>

      <HelpDialog 
        open={showHelpDialog} 
        onOpenChange={setShowHelpDialog}
      />

      <AboutDialog 
        open={showAboutDialog} 
        onOpenChange={setShowAboutDialog}
      />
    </header>
  );
};

export default Header;
