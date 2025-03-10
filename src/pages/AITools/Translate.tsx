
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import TranslateForm from '@/components/ai-tools/translate/TranslateForm';
import TranslateHeader from '@/components/ai-tools/translate/TranslateHeader';
import TranslationResult from '@/components/ai-tools/translate/TranslationResult';
import AIAgentDialog from '@/components/dialogs/AIAgentDialog';
import { toast } from 'sonner';
import DocumentSelector from '@/components/ai-tools/DocumentSelector';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BuyMeCoffee from '@/components/BuyMeCoffee';
import { SparklesIcon, Languages } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Translate = () => {
  const [outputLanguage, setOutputLanguage] = useState('Spanish');
  const [translationResult, setTranslationResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  
  const {
    selectedDocument,
    documentText,
    isLoading,
    error,
    handleDocumentSelect
  } = useDocumentSelection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentText.trim()) {
      toast.error('Please select a document with text content first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTranslationResult(`This is a simulated translation to ${outputLanguage} of the selected document.
      
      El documento discute conceptos clave relacionados con el tema, incluyendo hallazgos importantes y conclusiones. Los argumentos principales están bien estructurados y respaldados por evidencia de varias fuentes.
      
      En resumen, el documento proporciona información valiosa sobre el tema y sugiere varias áreas para futuras investigaciones y aplicaciones.`);
      
      toast.success(`Translation to ${outputLanguage} completed`);
    } catch (error) {
      toast.error('Failed to translate text');
    } finally {
      setIsProcessing(false);
    }
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
      <div className="container mx-auto py-8 px-4">
        <TranslateHeader onOpenDialog={() => setShowAIDialog(true)} />
        
        {renderDocumentSection()}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="border-primary/20 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Languages className="h-5 w-5 text-primary" />
              </div>
              <span>Translation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="translate" className="w-full">
              <TabsList className="mb-4 bg-background border border-input grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="translate" className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Translation</TabsTrigger>
                <TabsTrigger value="results" disabled={!translationResult} className="py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="translate">
                <TranslateForm
                  text={documentText}
                  language={outputLanguage}
                  setLanguage={setOutputLanguage}
                  isProcessing={isProcessing || isLoading}
                  onSubmit={handleSubmit}
                />
              </TabsContent>
              
              <TabsContent value="results">
                <TranslationResult 
                  result={translationResult} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="bg-[#111827] rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <SparklesIcon className="h-5 w-5 text-white mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">About Translation</h2>
              <p className="text-gray-300">
                Our AI-powered translation tool helps you convert documents into multiple languages 
                while preserving meaning and context.
              </p>
              <p className="text-gray-300">
                For best results, select a document with clear text content. The tool works best with 
                formal documents and may have limitations with highly technical or specialized content.
              </p>
            </div>
          </div>
        </div>
        
        <AIAgentDialog
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          selectedText={documentText}
          documentName={selectedDocument?.name || 'current document'}
          initialTask={`Translate this text to ${outputLanguage}`}
        />
      </div>
      
      <BuyMeCoffee creatorName="PDFlexo" />
    </Layout>
  );
};

export default Translate;
