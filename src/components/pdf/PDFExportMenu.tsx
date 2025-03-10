
import React from 'react';
import { ExportFormat } from '@/lib/pdfUtils/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image } from 'lucide-react';

interface PDFExportMenuProps {
  onExport: (format: ExportFormat) => void;
}

const PDFExportMenu: React.FC<PDFExportMenuProps> = ({ onExport }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Download className="h-5 w-5 text-[#0EA5E9] dark:text-[#33C3F0]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          <FileText className="h-4 w-4 mr-2 text-[#D946EF] dark:text-[#8B5CF6]" />
          <span>Download as PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('png')}>
          <Image className="h-4 w-4 mr-2 text-[#F97316] dark:text-[#F97316]" />
          <span>Export as PNG</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('jpeg')}>
          <Image className="h-4 w-4 mr-2 text-[#0EA5E9] dark:text-[#33C3F0]" />
          <span>Export as JPEG</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PDFExportMenu;
