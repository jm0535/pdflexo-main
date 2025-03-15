import { useState, useEffect, useRef } from "react";

/**
 * A hook that returns a boolean indicating whether the current viewport matches the provided media query
 * @param query The media query to match against (e.g., '(max-width: 640px)')
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Use a ref to store the initial value to avoid state updates during render
  const getMatches = (): boolean => {
    // Ensure we're in a browser environment
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // Initialize state with a function to avoid direct evaluation during render
  const [matches, setMatches] = useState<boolean>(() => getMatches());

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first effect run since we already set the initial value
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Create a media query list
    const mediaQuery = window.matchMedia(query);

    // Set the initial value
    setMatches(mediaQuery.matches);

    // Define a callback function to handle changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the event listener
    mediaQuery.addEventListener("change", handleChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
