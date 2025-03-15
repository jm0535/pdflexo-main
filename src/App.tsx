import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SplitPDF from "./pages/SplitPDF";
import MergePDF from "./pages/MergePDF";
import AIPDFTools from "./pages/AIPDFTools";
import SummarizeTool from "./pages/AITools/Summarize";
import TranslateTool from "./pages/AITools/Translate";
import ExplainTool from "./pages/AITools/Explain";
import FormatTool from "./pages/AITools/Format";
import ExtractTool from "./pages/AITools/Extract";
import AnswerTool from "./pages/AITools/Answer";
import { ToastProvider } from "./components/ToasterWrapper";

// Create a client with default options that work better with React 18
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Main App component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <TooltipProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/split" element={<SplitPDF />} />
                <Route path="/merge" element={<MergePDF />} />
                <Route path="/ai-tools" element={<AIPDFTools />} />
                <Route path="/ai-tools/summarize" element={<SummarizeTool />} />
                <Route path="/ai-tools/translate" element={<TranslateTool />} />
                <Route path="/ai-tools/explain" element={<ExplainTool />} />
                <Route path="/ai-tools/format" element={<FormatTool />} />
                <Route path="/ai-tools/extract" element={<ExtractTool />} />
                <Route path="/ai-tools/answer" element={<AnswerTool />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
