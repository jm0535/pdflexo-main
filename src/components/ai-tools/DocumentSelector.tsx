
import React, { useState, useEffect } from 'react';
import { PDFDocument } from '@/lib/types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, AlertCircle, Trash2, FileUp } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { pdfSessionStorage } from '@/services/PDFSessionStorage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentSelectorProps {
  onDocumentSelect: (document: PDFDocument) => void;
  selectedDocumentUrl?: string;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ 
  onDocumentSelect,
  selectedDocumentUrl
}) => {
  const [loadedDocuments, setLoadedDocuments] = useState<PDFDocument[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get stored PDFs from sessionStorage
    const storedDocuments = pdfSessionStorage.getAllDocuments();
    setLoadedDocuments(storedDocuments);
    
    // Auto-select the first document if none is selected
    if (storedDocuments.length > 0 && !selectedDocumentUrl) {
      onDocumentSelect(storedDocuments[0]);
    }
  }, [onDocumentSelect, selectedDocumentUrl]);

  const handleSelect = (value: string) => {
    const selectedDoc = loadedDocuments.find(doc => doc.url === value);
    if (selectedDoc) {
      onDocumentSelect(selectedDoc);
    }
  };
  
  const handleRemoveDocument = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pdfSessionStorage.removeDocument(url);
    setLoadedDocuments(pdfSessionStorage.getAllDocuments());
    
    if (selectedDocumentUrl === url) {
      const remainingDocs = loadedDocuments.filter(doc => doc.url !== url);
      if (remainingDocs.length > 0) {
        onDocumentSelect(remainingDocs[0]);
      }
    }
    
    toast.success('Document removed');
  };

  if (loadedDocuments.length === 0) {
    return (
      <Card className="mb-6 border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <FileUp className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">No documents loaded</h3>
              <p className="text-sm text-muted-foreground">
                Please upload a PDF document to get started
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="mt-2 bg-primary/10 hover:bg-primary/20 border-primary/20"
            >
              Go to Home Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 bg-background shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Select Document for AI Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select 
          value={selectedDocumentUrl} 
          onValueChange={handleSelect}
        >
          <SelectTrigger className="w-full bg-background border-input hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Select a document" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-auto">
            {loadedDocuments.map((doc) => (
              <SelectItem 
                key={doc.url} 
                value={doc.url}
                className="flex justify-between items-center py-2 px-2 cursor-pointer hover:bg-secondary/50 focus:bg-secondary/50"
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <div className="flex items-center gap-2 truncate max-w-[85%]">
                    <div className="bg-primary/10 p-1 rounded">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate font-medium">{doc.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={(e) => handleRemoveDocument(doc.url, e)}
                    title="Remove document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default DocumentSelector;
