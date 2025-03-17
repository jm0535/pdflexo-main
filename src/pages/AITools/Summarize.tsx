import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SummarizeForm from '@/components/ai-tools/summarize/SummarizeForm';
import SummarizeHeader from '@/components/ai-tools/summarize/SummarizeHeader';
import SummaryResult from '@/components/ai-tools/summarize/SummaryResult';
import AIAgentDialog from '@/components/dialogs/AIAgentDialog';
import { toast } from 'sonner';
import DocumentSelector from '@/components/ai-tools/DocumentSelector';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, SparklesIcon, AlertCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import ComingSoonBadge from '@/components/ai-tools/ComingSoonBadge';

const Summarize = () => {
  const [inputText, setInputText] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('summarize');
  
  const {
    selectedDocument,
    documentText,
    isLoading,
    error,
    handleDocumentSelect
  } = useDocumentSelection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summaryText = `This is a simulated summary of "${inputText.substring(0, 50)}..."
      
      The document discusses key concepts related to the subject matter, including important findings and conclusions. The primary arguments are well-structured and supported by evidence from various sources.
      
      In summary, the document provides valuable insights into the topic and suggests several areas for further research and application.`;
      
      setSummaryResult(summaryText);
      setActiveTab('results');
      toast.success('Summary generated successfully');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToInput = () => {
    setActiveTab('summarize');
  };

  const renderDocumentSection = () => {
    if (isLoading) {
      return (
        <Card className="mb-6 border-primary/20 shadow-md">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <DocumentSelector 
        onDocumentSelect={handleDocumentSelect}
        selectedDocumentUrl={selectedDocument?.url}
      />
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <SummarizeHeader onOpenDialog={() => setShowAIDialog(true)} />
        
        {renderDocumentSection()}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="border-primary/20 shadow-md mb-8 relative">
          <ComingSoonBadge />
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Text Summarization</CardTitle>
                <CardDescription>Extract key information from your documents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 bg-background border border-input grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="summarize" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Input Text</TabsTrigger>
                <TabsTrigger value="results" disabled={!summaryResult} className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Summary Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summarize">
                <SummarizeForm
                  input={documentText || inputText}
                  setInput={setInputText}
                  isProcessing={isProcessing || isLoading}
                  onSubmit={handleSubmit}
                />
              </TabsContent>
              
              <TabsContent value="results">
                <SummaryResult 
                  result={summaryResult} 
                  onBackToInput={handleBackToInput}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="bg-[#111827] rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <SparklesIcon className="h-5 w-5 text-white mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">About Text Summarization</h2>
              <p className="text-gray-300">
                Text summarization is the process of creating a concise and coherent version of a longer document
                while preserving its key information content and overall meaning.
              </p>
              <p className="text-gray-300">
                Our AI-powered tool uses advanced natural language processing to analyze your text and generate 
                summaries that capture the most important points without losing context.
              </p>
            </div>
          </div>
        </div>
        
        <AIAgentDialog
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          selectedText={documentText || inputText}
          documentName={selectedDocument?.name || 'current document'}
          initialTask="Summarize this text"
        />
      </div>
    </Layout>
  );
};

export default Summarize;
