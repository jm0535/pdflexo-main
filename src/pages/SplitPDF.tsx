import React, { useState } from "react";
import FileUpload from "@/components/FileUpload";
import { PDFDocument } from "@/lib/types";
import toast from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors } from "lucide-react";
import Layout from "@/components/Layout";

const SplitPDF = () => {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [splitPoints, setSplitPoints] = useState<number[]>([]);
  const [newSplitPoint, setNewSplitPoint] = useState<string>("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [totalPages, setTotalPages] = useState<number>(0);

  const handleFileLoaded = (newDoc: PDFDocument) => {
    setDocument(newDoc);
    setSplitPoints([]);
    toast.success(`PDF loaded: ${newDoc.name}`);
  };

  const handleAddSplitPoint = () => {
    const pageNum = parseInt(newSplitPoint);
    if (isNaN(pageNum) || pageNum < 1) {
      toast.error("Please enter a valid page number");
      return;
    }

    if (splitPoints.includes(pageNum)) {
      toast.error("This split point already exists");
      return;
    }

    setSplitPoints((prev) => [...prev, pageNum].sort((a, b) => a - b));
    setNewSplitPoint("");
  };

  const handleRemoveSplitPoint = (point: number) => {
    setSplitPoints((prev) => prev.filter((p) => p !== point));
  };

  const handleSplitPDF = () => {
    setIsSplitting(true);

    // In a real implementation, you would use pdf.js or a similar library to actually split the PDF
    setTimeout(() => {
      toast.success("PDF has been split into multiple files!");
      setIsSplitting(false);

      // In a production app, you might want to generate download links for the split PDFs
    }, 1500);
  };

  return (
    <Layout>
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-foreground">
              <Scissors className="w-6 h-6 mr-2 text-primary" />
              Split PDF
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload a PDF file and specify the page numbers where you want to
              split the document into separate files.
            </p>

            {!document ? (
              <div className="mb-6">
                <FileUpload
                  onFileLoaded={handleFileLoaded}
                  onTotalPagesChange={setTotalPages}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-secondary rounded-md flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {document.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {document.totalPages} pages
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setDocument(null)}>
                    Change File
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Add Split Points
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the page numbers where you want to split the document.
                    For example, entering "3" will create a split before page 3.
                  </p>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={document.totalPages}
                      placeholder="Page number"
                      value={newSplitPoint}
                      onChange={(e) => setNewSplitPoint(e.target.value)}
                      className="max-w-[150px]"
                    />
                    <Button onClick={handleAddSplitPoint}>
                      Add Split Point
                    </Button>
                  </div>

                  {splitPoints.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-foreground">
                        Current Split Points:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {splitPoints.map((point) => (
                          <div
                            key={point}
                            className="bg-secondary px-3 py-1 rounded-full flex items-center"
                          >
                            <span className="text-foreground">
                              Page {point}
                            </span>
                            <button
                              className="ml-2 text-primary hover:text-primary/80"
                              onClick={() => handleRemoveSplitPoint(point)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleSplitPDF}
                      disabled={splitPoints.length === 0 || isSplitting}
                      className="w-full"
                    >
                      {isSplitting ? (
                        <>
                          <span className="animate-spin mr-2">⊷</span>
                          Splitting PDF...
                        </>
                      ) : (
                        <>Split PDF into {splitPoints.length + 1} files</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {splitPoints.length > 0 && document && (
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-medium mb-4 text-foreground">
                Preview of Split Files
              </h3>
              <div className="space-y-3">
                <div className="p-3 border border-border rounded-md">
                  <p className="font-medium text-foreground">File 1</p>
                  <p className="text-sm text-muted-foreground">
                    Pages 1 to {splitPoints[0] - 1}
                  </p>
                </div>

                {splitPoints.map((point, index) => (
                  <div
                    key={point}
                    className="p-3 border border-border rounded-md"
                  >
                    <p className="font-medium text-foreground">
                      File {index + 2}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pages {point} to{" "}
                      {splitPoints[index + 1]
                        ? splitPoints[index + 1] - 1
                        : document.totalPages}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default SplitPDF;
