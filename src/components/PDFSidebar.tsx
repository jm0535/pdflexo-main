import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Scissors, Layers, Sparkles, Home, BookOpen, Languages, List, Search, FileQuestion, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarOverlay,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toggleTheme } from '@/lib/pdfUtils/viewUtils';
import { toast } from 'sonner';

const mainNavItems = [
  { title: 'Home', path: '/', icon: Home, color: '#0EA5E9' },
  { title: 'Split PDF', path: '/split', icon: Scissors, color: '#F97316' },
  { title: 'Merge PDF', path: '/merge', icon: Layers, color: '#D946EF' },
  { title: 'AI Tools', path: '/ai-tools', icon: Sparkles, color: '#8B5CF6' },
];

const aiToolsItems = [
  { title: 'Summarize', path: '/ai-tools/summarize', icon: FileText, color: '#0EA5E9' },
  { title: 'Explain', path: '/ai-tools/explain', icon: BookOpen, color: '#8B5CF6' },
  { title: 'Translate', path: '/ai-tools/translate', icon: Languages, color: '#F97316' },
  { title: 'Format', path: '/ai-tools/format', icon: List, color: '#D946EF' },
  { title: 'Extract', path: '/ai-tools/extract', icon: Search, color: '#1EAEDB' },
  { title: 'Ask Questions', path: '/ai-tools/answer', icon: FileQuestion, color: '#33C3F0' },
];

const PDFSidebar: React.FC = () => {
  const location = useLocation();
  const { expanded, isMobileView, isOpen, toggleExpanded } = useSidebar();
  const [isDark, setIsDark] = useState(false); // Initialize with a default value

  // Initialize the dark mode state in useEffect, not during render
  useEffect(() => {
    const htmlElement = document.querySelector('html');
    const isDarkMode = htmlElement?.classList.contains('dark') || false;
    setIsDark(isDarkMode);

    // Add event listener to track theme changes from other sources
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const htmlEl = document.querySelector('html');
          setIsDark(htmlEl?.classList.contains('dark') || false);
        }
      });
    });

    const htmlEl = document.querySelector('html');
    if (htmlEl) {
      observer.observe(htmlEl, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleThemeToggle = () => {
    const newIsDark = toggleTheme();
    setIsDark(newIsDark);
    toast.success(newIsDark ? "Dark theme activated" : "Light theme activated");

    // Dispatch a custom event for components to react to theme changes
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: newIsDark } }));
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isInAITools = () => location.pathname.startsWith('/ai-tools');

  return (
    <>
      <SidebarOverlay />
      <Sidebar>
        <SidebarHeader>
          <Link to="/" className="flex items-center justify-center">
            <FileText className={`${expanded || isMobileView ? 'w-6 h-6' : 'w-8 h-8'} text-[#9b87f5] dark:text-[#8B5CF6]`} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className={`${isMobileView ? 'hidden' : 'flex'}`}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeft className="h-5 w-5 text-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-foreground" />
            )}
          </Button>
          {isMobileView && <SidebarTrigger />}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={isActive(item.path) ? 'bg-accent text-accent-foreground' : ''}
                      >
                        <item.icon className={`${expanded || isMobileView ? 'w-5 h-5' : 'w-5 h-5'} text-[${item.color}]`} />
                        {(expanded || isMobileView) && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {(expanded || isMobileView || isInAITools()) && (
            <SidebarGroup>
              <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {aiToolsItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.path}
                          className={`${location.pathname === item.path ? 'bg-accent text-accent-foreground' : ''} relative`}
                        >
                          <item.icon className={`${expanded || isMobileView ? 'w-5 h-5' : 'w-5 h-5'} text-[${item.color}]`} />
                          {(expanded || isMobileView) && (
                            <div className="flex items-center">
                              <span>{item.title}</span>
                              <Badge className="ml-2 text-[0.6rem] px-1 py-0 h-4 bg-orange-500 text-white border-orange-600">SOON</Badge>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="flex items-center justify-center">
          {(expanded || isMobileView) ? (
            <div className="w-full flex items-center justify-between">
              <div className="text-xs text-muted-foreground">PDFlexo v1.0.0</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
                className="ml-2"
              >
                {isDark ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-[#F97316]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-[#8B5CF6]" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
              className="w-full flex justify-center"
            >
              {isDark ? (
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-[#F97316]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-[#8B5CF6]" />
              )}
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default PDFSidebar;
