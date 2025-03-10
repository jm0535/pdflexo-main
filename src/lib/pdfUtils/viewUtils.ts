
// Function to set zoom level in the document
export const setZoomLevel = (level: number): void => {
  if (level < 0.3 || level > 2.0) {
    console.warn('Zoom level should be between 0.3 and 2.0');
    return;
  }
  
  document.body.style.zoom = level.toString();
};

// Function to get current zoom level from the document
export const getZoomLevel = (): number => {
  return parseFloat(document.body.style.zoom || '1');
};

// Function to toggle between light and dark themes
export const toggleTheme = (): boolean => {
  const htmlElement = document.querySelector('html');
  const isDark = htmlElement?.classList.contains('dark') || false;
  
  if (isDark) {
    htmlElement?.classList.remove('dark');
    return false; // Now in light mode
  } else {
    htmlElement?.classList.add('dark');
    return true; // Now in dark mode
  }
};

// Function to toggle fullscreen mode
export const toggleFullscreen = (): boolean => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
    return true; // Now in fullscreen
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    return false; // No longer in fullscreen
  }
};

// Available view modes for PDF display
export type ViewMode = 'single' | 'dual';

// Function to determine if we should show the secondary page
export const shouldShowSecondaryPage = (
  viewMode: ViewMode,
  currentPage: number,
  totalPages: number
): boolean => {
  if (viewMode === 'single') return false;
  
  // In dual mode, check if there's a next page available
  return viewMode === 'dual' && currentPage < totalPages;
};
