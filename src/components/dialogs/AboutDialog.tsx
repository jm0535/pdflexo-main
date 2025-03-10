
import React from 'react';
import { FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
            About PDFlexo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold">PDFlexo</span> is a <span className="text-emerald-600 dark:text-emerald-400 font-medium">free and open-source</span> PDF management tool that allows you to view, split, merge, annotate, and sign PDF documents directly in your browser.
          </p>
          <div>
            <h3 className="text-sm font-semibold">Version</h3>
            <p className="text-gray-600 dark:text-gray-300">1.0.0</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Technologies</h3>
            <p className="text-gray-600 dark:text-gray-300">Built with React, TypeScript, Tailwind CSS, and PDF.js</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">License</h3>
            <p className="text-gray-600 dark:text-gray-300">MIT License - Free to use, modify, and distribute</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Privacy</h3>
            <p className="text-gray-600 dark:text-gray-300">All PDF processing happens locally in your browser. Your documents are never uploaded to any server.</p>
          </div>
          <div className="pt-2 text-center text-gray-400 text-sm dark:text-gray-500">
            © 2023 PDFlexo. All rights reserved.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
