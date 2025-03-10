import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Environment configuration
export const getEnvironment = () => {
  return import.meta.env.VITE_APP_ENV || 'development'
}

export const isProduction = () => getEnvironment() === 'production'
export const isPreview = () => getEnvironment() === 'preview'
export const isDevelopment = () => getEnvironment() === 'development'

// API and base URL configuration
export const getBaseUrl = () => {
  return import.meta.env.VITE_APP_BASE_URL || window.location.origin
}

export const getApiUrl = () => {
  return import.meta.env.VITE_APP_API_URL || `${window.location.origin}/api`
}
