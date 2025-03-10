
import React from 'react';
import { Menu, Download, FileText, File, FileCode } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { ExportFormat } from '@/lib/pdfUtils/exportUtils';

interface MainMenuProps {
  onExport: (format?: ExportFormat) => void;
  onPrint: () => void;
  onHelp: () => void;
  onAbout: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onExport,
  onPrint,
  onHelp,
  onAbout
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn-icon">
          <Menu className="w-5 h-5 text-[#D946EF] dark:text-[#8B5CF6]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Menu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Download className="mr-2 h-4 w-4 text-[#0EA5E9] dark:text-[#33C3F0]" />
            Export Document
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              <FileText className="mr-2 h-4 w-4 text-[#D946EF] dark:text-[#8B5CF6]" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('docx')}>
              <File className="mr-2 h-4 w-4 text-[#F97316] dark:text-[#F97316]" />
              DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('md')}>
              <File className="mr-2 h-4 w-4 text-[#0EA5E9] dark:text-[#33C3F0]" />
              Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('html')}>
              <FileCode className="mr-2 h-4 w-4 text-[#8B5CF6] dark:text-[#D946EF]" />
              HTML
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuItem onClick={onPrint}>
          Print
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onHelp}>
          Help
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAbout}>
          About PDFlexo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MainMenu;
