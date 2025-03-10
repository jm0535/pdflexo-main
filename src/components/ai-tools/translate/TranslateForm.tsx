
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface TranslateFormProps {
  text: string;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const TranslateForm: React.FC<TranslateFormProps> = ({
  text,
  language,
  setLanguage,
  isProcessing,
  onSubmit
}) => {
  const languages = [
    "Spanish", "French", "German", "Italian", "Portuguese", 
    "Russian", "Chinese", "Japanese", "Korean", "Arabic"
  ];
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="text-to-translate">Text to Translate</Label>
        <Textarea
          id="text-to-translate"
          value={text}
          readOnly
          className="min-h-[200px] font-mono text-sm"
          placeholder="Select a document to see its content here..."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="target-language">Target Language</Label>
        <Select 
          value={language} 
          onValueChange={setLanguage}
          disabled={isProcessing}
        >
          <SelectTrigger id="target-language" className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isProcessing || !text.trim()}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Translating...
          </>
        ) : (
          "Translate Document"
        )}
      </Button>
    </form>
  );
};

export default TranslateForm;
