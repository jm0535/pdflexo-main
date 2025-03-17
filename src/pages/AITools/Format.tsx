import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { List, Loader2, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AIAgentDialog from "@/components/dialogs/AIAgentDialog";
import DocumentSelector from '@/components/ai-tools/DocumentSelector';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ComingSoonBadge from '@/components/ai-tools/ComingSoonBadge';

const FormatTool = () => {
  const [input, setInput] = useState('');
  const [formatType, setFormatType] = useState('bullet-points');
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
    
    const textToFormat = documentText || input;
    
    if (!textToFormat.trim()) {
      toast.error('Please enter some text to format');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let formattedText = '';
      
      switch (formatType) {
        case 'bullet-points':
          formattedText = `• First key point extracted from your text
• Second important concept or idea
• Another significant element from the content
• Additional relevant information
• Final crucial point or conclusion`;
          break;
        case 'numbered-list':
          formattedText = `1. First key point extracted from your text
2. Second important concept or idea
3. Another significant element from the content
4. Additional relevant information
5. Final crucial point or conclusion`;
          break;
        case 'table':
          formattedText = `| Category | Description | Value |
|----------|-------------|-------|
| Item 1   | Description of item 1 | Value 1 |
| Item 2   | Description of item 2 | Value 2 |
| Item 3   | Description of item 3 | Value 3 |`;
          break;
        case 'headings':
          formattedText = `# Main Title Derived From Text

## First Major Section
Key points about this section.

## Second Major Section
Important information related to this topic.

## Third Major Section
Conclusions and additional insights.`;
          break;
        default:
          formattedText = `• First key point extracted from your text
• Second important concept or idea
• Another significant element from the content
• Additional relevant information
• Final crucial point or conclusion`;
      }
      
      setResult(formattedText);
      setActiveTab('result');
      toast.success(`Text formatted into ${formatType.replace('-', ' ')}`);
    } catch (error) {
      console.error('Error formatting text:', error);
      toast.error('Failed to format text');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Formatted text copied to clipboard');
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
              <List className="h-6 w-6 text-[#D946EF]" />
              <h1 className="text-2xl font-bold">Format and Structure</h1>
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
              <CardTitle>Format Text</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="input">Input</TabsTrigger>
                  <TabsTrigger value="result" disabled={!result}>Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="Paste text here to convert it into a structured format..."
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
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Format Type
                      </label>
                      <Select value={formatType} onValueChange={setFormatType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bullet-points">Bullet Points</SelectItem>
                          <SelectItem value="numbered-list">Numbered List</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                          <SelectItem value="headings">Headings & Sections</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button type="submit" disabled={isProcessing || (!input.trim() && !documentText.trim())}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Formatting Text...
                        </>
                      ) : (
                        'Format Text'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="result">
                  <div className="space-y-4">
                    <div className="bg-secondary/50 p-4 rounded-md min-h-[200px] whitespace-pre-line font-mono">
                      {result}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveTab('input')}>
                        Back to Input
                      </Button>
                      <Button onClick={handleCopy}>
                        Copy Formatted Text
                      </Button>
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
                  <h2 className="text-xl font-semibold">About Formatting Tool</h2>
                  <p className="text-muted-foreground">
                    Our formatting tool helps transform plain paragraphs into structured formats that are 
                    easier to read, present, and understand.
                  </p>
                  <p className="text-muted-foreground">
                    Choose from multiple formatting options:
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li><strong>Bullet Points</strong> - Convert text into concise bullet points</li>
                    <li><strong>Numbered Lists</strong> - Create sequential, numbered lists</li>
                    <li><strong>Tables</strong> - Organize information into structured tables</li>
                    <li><strong>Headings & Sections</strong> - Add hierarchy with headings and subheadings</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AIAgentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        initialTask={`Format this text into ${formatType.replace('-', ' ')}`}
        selectedText={documentText || input}
        documentName={selectedDocument?.name || "Format Tool"}
      />
    </Layout>
  );
};

export default FormatTool;
