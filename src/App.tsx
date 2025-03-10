
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';
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

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
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
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
