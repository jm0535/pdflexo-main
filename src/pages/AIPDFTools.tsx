
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, BookOpen, Languages, List, Search, FileQuestion } from 'lucide-react';
import Layout from '@/components/Layout';

const AIPDFTools = () => {
  const navigate = useNavigate();
  
  const aiFeatures = [
    {
      title: 'Summarize Documents',
      description: 'Get concise summaries of long PDF documents or selected sections.',
      icon: <FileText className="h-8 w-8 text-[#0EA5E9] dark:text-[#33C3F0]" />,
      path: '/ai-tools/summarize'
    },
    {
      title: 'Explain Complex Content',
      description: 'Get simplified explanations of technical or difficult passages.',
      icon: <BookOpen className="h-8 w-8 text-[#8B5CF6] dark:text-[#8B5CF6]" />,
      path: '/ai-tools/explain'
    },
    {
      title: 'Translate Text',
      description: 'Translate document content between multiple languages.',
      icon: <Languages className="h-8 w-8 text-[#F97316] dark:text-[#F97316]" />,
      path: '/ai-tools/translate'
    },
    {
      title: 'Format and Structure',
      description: 'Convert paragraphs into bullet points, tables, or other structured formats.',
      icon: <List className="h-8 w-8 text-[#D946EF] dark:text-[#D946EF]" />,
      path: '/ai-tools/format'
    },
    {
      title: 'Extract Key Information',
      description: 'Pull out names, dates, figures, and other important details.',
      icon: <Search className="h-8 w-8 text-[#1EAEDB] dark:text-[#1EAEDB]" />,
      path: '/ai-tools/extract'
    },
    {
      title: 'Answer Questions',
      description: 'Ask questions about the document content and get accurate answers.',
      icon: <FileQuestion className="h-8 w-8 text-[#33C3F0] dark:text-[#33C3F0]" />,
      path: '/ai-tools/answer'
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-secondary rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-[#8B5CF6] dark:text-[#D946EF]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI-Powered PDF Tools</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Enhanced document intelligence to help you extract insights, understand content, and work more efficiently with your PDFs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className="border border-border hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  {feature.icon}
                  <div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                  <Button className="mt-4 w-full" variant="outline">
                    Open Tool
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 bg-secondary/50 p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">How to Use AI Features</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>1. Open any PDF document in the viewer</p>
              <p>2. Select text you want to analyze (optional)</p>
              <p>3. Click the "AI Assistant" button in the toolbar</p>
              <p>4. Choose a preset task or type your own request</p>
              <p>5. Review the AI-generated results</p>
              <p className="pt-2 font-medium text-foreground">You can also use any of our dedicated AI tools above for specific tasks!</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIPDFTools;
