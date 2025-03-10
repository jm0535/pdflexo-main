import { saveAs } from 'file-saver';
import { Download, FileType, File } from 'lucide-react';
import { toast } from 'sonner';

// Function to print the current PDF document
export const printPdf = (pdfUrl: string | undefined): void => {
  if (!pdfUrl) {
    console.error('No PDF URL provided for printing');
    return;
  }
  
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  
  document.body.appendChild(printFrame);
  printFrame.src = pdfUrl;
  
  printFrame.onload = () => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    } catch (error) {
      console.error('Failed to print PDF', error);
      document.body.removeChild(printFrame);
    }
  };
};

// Function to download a file
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

// Function to export the current PDF with modifications (if any)
export const exportPdf = async (
  pdfUrl: string | undefined,
  annotations: any[] = []
): Promise<void> => {
  if (!pdfUrl) {
    console.error('No PDF URL provided for export');
    return;
  }
  
  try {
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    const filename = pdfUrl.split('/').pop() || 'document.pdf';
    
    downloadFile(blob, `exported_${filename}`);
  } catch (error) {
    console.error('Failed to export PDF', error);
  }
};

// Function to generate a basic representation of the PDF content
const extractPdfContent = async (pdfUrl: string): Promise<string> => {
  try {
    return "PDF content extracted from " + pdfUrl;
  } catch (error) {
    console.error('Failed to extract PDF content', error);
    return '';
  }
};

// Convert text to HTML format
const convertToHtml = (text: string): string => {
  const paragraphs = text.split('\n\n');
  const htmlContent = paragraphs.map(p => `<p>${p}</p>`).join('');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Document</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
};

// Convert text to Markdown format
const convertToMarkdown = (text: string): string => {
  const paragraphs = text.split('\n\n');
  return paragraphs.join('\n\n');
};

// Convert text to DOCX format (mock implementation)
const convertToDocx = (text: string): Blob => {
  return new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
};

// Updated ExportFormat type to include image formats
export type ExportFormat = 'pdf' | 'docx' | 'md' | 'html' | 'png' | 'jpeg';

// Function to export PDF to different formats
export const exportToFormat = async (
  pdfUrl: string | undefined, 
  format: ExportFormat
): Promise<void> => {
  if (!pdfUrl) {
    toast.error('No document to export');
    return;
  }
  
  try {
    toast.loading(`Converting document to ${format.toUpperCase()}...`);
    
    const origFilename = pdfUrl.split('/').pop() || 'document';
    const baseFilename = origFilename.replace(/\.[^/.]+$/, "");
    
    const content = await extractPdfContent(pdfUrl);
    
    let exportedBlob: Blob;
    let filename: string;
    
    switch (format) {
      case 'pdf':
        const response = await fetch(pdfUrl);
        exportedBlob = await response.blob();
        filename = `${baseFilename}.pdf`;
        break;
        
      case 'docx':
        exportedBlob = convertToDocx(content);
        filename = `${baseFilename}.docx`;
        break;
        
      case 'md':
        const markdownContent = convertToMarkdown(content);
        exportedBlob = new Blob([markdownContent], { type: 'text/markdown' });
        filename = `${baseFilename}.md`;
        break;
        
      case 'html':
        const htmlContent = convertToHtml(content);
        exportedBlob = new Blob([htmlContent], { type: 'text/html' });
        filename = `${baseFilename}.html`;
        break;
        
      case 'png':
        toast.info('PNG export is not fully implemented in this demo');
        exportedBlob = new Blob(['PNG export placeholder'], { type: 'image/png' });
        filename = `${baseFilename}.png`;
        break;
        
      case 'jpeg':
        toast.info('JPEG export is not fully implemented in this demo');
        exportedBlob = new Blob(['JPEG export placeholder'], { type: 'image/jpeg' });
        filename = `${baseFilename}.jpeg`;
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    downloadFile(exportedBlob, filename);
    toast.success(`Document exported as ${format.toUpperCase()}`);
    
  } catch (error) {
    console.error(`Failed to export to ${format}:`, error);
    toast.error(`Failed to export to ${format.toUpperCase()}`);
  }
};

// Legacy function alias for backward compatibility
export const downloadPdf = downloadFile;
