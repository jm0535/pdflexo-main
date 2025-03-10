
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <h3 className="text-lg font-semibold">Viewing PDFs</h3>
            <p className="text-gray-600 dark:text-gray-300">Upload a PDF to view its contents. You can scroll through pages using the navigation controls at the bottom.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Splitting PDFs</h3>
            <p className="text-gray-600 dark:text-gray-300">Go to the Split tab to separate a PDF into multiple files. You can specify page ranges or split at specific pages.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Merging PDFs</h3>
            <p className="text-gray-600 dark:text-gray-300">Use the Merge tab to combine multiple PDFs into a single document. Drag and drop to reorder files before merging.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Text Selection and Copying</h3>
            <p className="text-gray-600 dark:text-gray-300">Select text with the pointer tool and click the Copy button to copy the text to your clipboard.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Annotations</h3>
            <p className="text-gray-600 dark:text-gray-300">Use the Highlight tool to mark important sections of text. Use the Sign tool to add your signature to documents.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
              <li>←/→ Arrow keys: Navigate between pages</li>
              <li>Ctrl/Cmd + =: Zoom in</li>
              <li>Ctrl/Cmd + -: Zoom out</li>
              <li>Ctrl/Cmd + 0: Reset zoom</li>
              <li>Ctrl + F: Toggle fullscreen</li>
              <li>Ctrl/Cmd + P: Print document</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
