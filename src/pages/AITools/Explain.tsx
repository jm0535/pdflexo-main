import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Loader2, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import AIAgentDialog from "@/components/dialogs/AIAgentDialog";
import DocumentSelector from '@/components/ai-tools/DocumentSelector';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ComingSoonBadge from '@/components/ai-tools/ComingSoonBadge';

const ExplainTool = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
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
    
    if (!input.trim() && !documentText.trim()) {
      toast.error('Please enter some text to explain');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const textToExplain = documentText || input;
      const explanation = `Here's a simplified explanation of the text:
      
      The content you provided discusses complex concepts in a way that can be difficult to understand at first. Breaking it down:

      1. The main idea is about [key concept] which means [simplified explanation].
      
      2. When it mentions [technical term], it's simply referring to [everyday explanation].
      
      3. The relationship between [concept A] and [concept B] can be thought of as [simple analogy].
      
      In simpler terms, the text is explaining how [straightforward summary of the main point].`;
      
      setResult(explanation);
      setActiveTab('result');
      toast.success('Explanation generated successfully');
    } catch (error) {
      console.error('Error generating explanation:', error);
      toast.error('Failed to generate explanation');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Explanation copied to clipboard');
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="mr-2"
              >
                ← Back to AI Tools
              </Button>
              <BookOpen className="h-6 w-6 text-[#8B5CF6]" />
              <h1 className="text-2xl font-bold">Explain Complex Content</h1>
            </div>
            <Button variant="outline" onClick={() => setShowDialog(true)}>
              Open AI Assistant
            </Button>
          </div>
          
          <DocumentSelector 
            onDocumentSelect={handleDocumentSelect}
            selectedDocumentUrl={selectedDocument?.url}
          />
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <Card className="border-primary/20 shadow-md mb-8 relative">
            <ComingSoonBadge />
            <CardHeader className="pb-2 border-b">
              <CardTitle>Explain Complex Text</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="input">Input</TabsTrigger>
                  <TabsTrigger value="result" disabled={!result}>Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input">
                  <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Paste complex or technical text here to get a simplified explanation..."
                          className="min-h-[200px]"
                          value={documentText || input}
                          onChange={(e) => setInput(e.target.value)}
                          disabled={!!documentText}
                        />
                        {documentText && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Using text from selected document. To use different text, clear the document selection.
                          </p>
                        )}
                      </div>
                      <Button type="submit" disabled={isProcessing || (!input.trim() && !documentText.trim())}>
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Explanation...
                          </>
                        ) : (
                          'Explain This Text'
                        )}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
                
                <TabsContent value="result">
                  <div className="space-y-4">
                    <div className="bg-secondary/50 p-4 rounded-md min-h-[200px] whitespace-pre-line">
                      {result}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveTab('input')}>
                        Back to Input
                      </Button>
                      <Button onClick={handleCopy}>
                        Copy Explanation
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Separator className="my-8" />
          
          <div className="bg-[#111827] rounded-lg p-6 text-white">
            <div className="flex items-start gap-4">
              <SparklesIcon className="h-5 w-5 text-white mt-1" />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">About Explanation Tool</h2>
                <p className="text-gray-300">
                  Our explanation tool uses AI to break down complex or technical content into simpler, 
                  more accessible language. This is particularly helpful for:
                </p>
                <ul className="list-disc pl-5 text-gray-300 space-y-1">
                  <li>Technical documents or academic papers</li>
                  <li>Legal text or contracts</li>
                  <li>Specialized industry jargon</li>
                  <li>Complex concepts or theoretical frameworks</li>
                </ul>
                <p className="text-gray-300">
                  Simply paste the text you find difficult to understand, and our AI will provide a 
                  simplified explanation that maintains the key points while making it more approachable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AIAgentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        initialTask="Explain this text in simpler terms"
        selectedText={documentText || input}
        documentName={selectedDocument?.name || "Explain Tool"}
      />
    </Layout>
  );
};

export default ExplainTool;
