import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AIAgentDialog from "@/components/dialogs/AIAgentDialog";
import DocumentSelector from '@/components/ai-tools/DocumentSelector';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AnswerHeader from '@/components/ai-tools/answer/AnswerHeader';
import AnswerForm from '@/components/ai-tools/answer/AnswerForm';
import AnswerResult from '@/components/ai-tools/answer/AnswerResult';
import { FileQuestion, SparklesIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ComingSoonBadge from '@/components/ai-tools/ComingSoonBadge';

const AnswerTool = () => {
  const [documentContext, setDocumentContext] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [showDialog, setShowDialog] = useState(false);

  const {
    selectedDocument,
    documentText,
    isLoading,
    error,
    handleDocumentSelect
  } = useDocumentSelection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (!documentText && !documentContext.trim()) {
      toast.error('Please either select a document or enter document context');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const contextText = documentText || documentContext;
      
      setAnswer(`Based on the document provided, the answer to your question "${question}" is:
      
      The document indicates that this specific question relates to [relevant section from context]. According to the text, [detailed answer addressing the question].
      
      Additionally, it's worth noting that [supplementary information from the document that provides further context or nuance to the answer].
      
      In summary, [concise answer to the original question].`);
      
      setActiveTab('result');
      toast.success('Answer generated successfully');
    } catch (error) {
      console.error('Error generating answer:', error);
      toast.error('Failed to generate answer');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAskAnother = () => {
    setActiveTab('input');
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
        <AnswerHeader onOpenDialog={() => setShowDialog(true)} />
        
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
                <FileQuestion className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Ask Questions About Documents</CardTitle>
                <CardDescription>Get precise answers from your document content</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 bg-background border border-input grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="input" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Ask a Question</TabsTrigger>
                <TabsTrigger value="result" disabled={!answer} className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Answer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="input">
                <AnswerForm
                  documentText={documentText}
                  documentContext={documentContext}
                  setDocumentContext={setDocumentContext}
                  question={question}
                  setQuestion={setQuestion}
                  isProcessing={isProcessing || isLoading}
                  onSubmit={handleSubmit}
                />
              </TabsContent>
              
              <TabsContent value="result">
                <AnswerResult
                  question={question}
                  answer={answer}
                  onAskAnother={handleAskAnother}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="bg-[#111827] rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <SparklesIcon className="h-5 w-5 text-white mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">About Question Answering</h2>
              <p className="text-gray-300">
                This tool allows you to ask specific questions about document content and receive 
                precise answers based on the information contained within the document.
              </p>
              <div className="space-y-2">
                <p className="text-gray-300 font-medium">For best results:</p>
                <ul className="list-disc pl-5 text-gray-300 space-y-1">
                  <li>Ask clear, specific questions</li>
                  <li>Make sure your document or context contains the relevant information</li>
                  <li>Use complete sentences in your questions</li>
                  <li>Try to avoid overly broad or vague questions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <AIAgentDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          initialTask={`Answer the following question: ${question}`}
          selectedText={documentText || documentContext}
          documentName={selectedDocument?.name || "Q&A Tool"}
        />
      </div>
    </Layout>
  );
};

export default AnswerTool;
