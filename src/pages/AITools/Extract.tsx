
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from "@/components/ui/separator";
import { AIAgentService } from '@/services/AIAgentService';
import { toast } from 'sonner';
import AIAgentDialog from '@/components/dialogs/AIAgentDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, SparklesIcon, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DocumentSelector from '@/components/ai-tools/DocumentSelector';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import { Alert, AlertDescription } from "@/components/ui/alert";
import BuyMeCoffee from '@/components/BuyMeCoffee';

const ExtractTool = () => {
  const navigate = useNavigate();
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
    
    const textToProcess = documentText || input;
    
    if (!textToProcess.trim()) {
      toast.error('Please enter some text to extract information from');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await AIAgentService.processRequest({
        type: 'extract',
        text: textToProcess
      });
      
      setResult(response.text);
      setActiveTab('result');
      toast.success('Information successfully extracted');
    } catch (error) {
      console.error('Error extracting information:', error);
      toast.error('Failed to extract information');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Extracted information copied to clipboard');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `extracted_info_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Extracted information downloaded');
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/ai-tools')}
              className="mr-2"
            >
              ← Back to AI Tools
            </Button>
            <Search className="h-6 w-6 text-[#1EAEDB]" />
            <h1 className="text-2xl font-bold">Extract Key Information</h1>
          </div>
          <Button variant="outline" onClick={handleOpenDialog}>
            Open AI Assistant
          </Button>
        </div>
          
        <DocumentSelector 
          onDocumentSelect={handleDocumentSelect}
          selectedDocumentUrl={selectedDocument?.url}
        />
          
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
          
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Extract Key Information</CardTitle>
                <CardDescription>Find names, dates, numbers, and important details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-background border border-input grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="input" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Input</TabsTrigger>
                <TabsTrigger value="result" disabled={!result} className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Results</TabsTrigger>
              </TabsList>
                
              <TabsContent value="input">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="Paste your text here to extract key information..."
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
                        Extracting Information...
                      </>
                    ) : (
                      'Extract Information'
                    )}
                  </Button>
                </form>
              </TabsContent>
                
              <TabsContent value="result">
                <div className="space-y-4">
                  <div className="bg-secondary/50 p-4 rounded-md min-h-[200px] whitespace-pre-line font-mono text-sm">
                    {result}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('input')}>
                      Back to Input
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handleCopy}>
                        Copy Results
                      </Button>
                      <Button variant="outline" onClick={handleDownload}>
                        Download Results
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Separator className="my-8" />
        
        <Card className="border-primary/10 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-md mt-1">
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">About Information Extraction</h2>
                <p className="text-muted-foreground">
                  Our AI extraction tool automatically identifies and pulls key information from your documents, including:
                </p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Names of people, organizations, and places</li>
                  <li>Dates, times, and durations</li>
                  <li>Numerical data including statistics and measurements</li>
                  <li>Contact information like emails, phone numbers, and addresses</li>
                  <li>Technical terms and domain-specific vocabulary</li>
                </ul>
                <p className="text-muted-foreground">
                  This tool is particularly useful for quickly analyzing research papers, legal documents, 
                  financial reports, and any text that contains numerous factual details that would be 
                  time-consuming to manually identify.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AIAgentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        initialTask="Extract key information from this text"
        selectedText={documentText || input}
        documentName={selectedDocument?.name || "Extract Tool"}
      />

      <BuyMeCoffee creatorName="PDFlexo" />
    </Layout>
  );
};

export default ExtractTool;
