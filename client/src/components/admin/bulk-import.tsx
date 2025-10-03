import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ImportResult {
  message: string;
  success: number;
  errors: number;
  errorDetails: Array<{ row: any; error: string }>;
}

export default function BulkImport() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import products');
      }

      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Import Completed",
        description: data.message,
      });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Bulk Import Products</h2>
        <p className="text-muted-foreground">
          Upload an Excel or CSV file to import multiple products at once
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Format Requirements</CardTitle>
          <CardDescription>
            Your Excel/CSV file should have the following columns:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>Brand</strong> - Product brand (Atlas Copco, Epiroc, Sandvik, Furukawa)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>Product Number</strong> - Unique product number/code
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>Product Name</strong> - Product name/title
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Products will be imported with default stock status "In Stock". You can edit other details after import.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {selectedFile ? (
              <div className="space-y-4">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-primary" />
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="bg-primary text-primary-foreground"
                    data-testid="button-import"
                  >
                    {importMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Import Products
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="outline"
                    disabled={importMutation.isPending}
                    data-testid="button-cancel-file"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground mb-2">
                    Select Excel or CSV file to upload
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-file"
                    />
                    <Button variant="outline" className="pointer-events-none" data-testid="button-browse-file">
                      <Upload size={16} className="mr-2" />
                      Browse Files
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg" data-testid="result-success">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Successful</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2" data-testid="count-success">
                  {importResult.success}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg" data-testid="result-errors">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2" data-testid="count-errors">
                  {importResult.errors}
                </p>
              </div>
            </div>

            {importResult.errorDetails.length > 0 && (
              <div className="mt-4" data-testid="error-details-section">
                <h4 className="font-semibold text-foreground mb-2">Error Details:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importResult.errorDetails.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 dark:bg-red-950 rounded-md text-sm" data-testid={`error-detail-${index}`}>
                      <p className="text-red-700 dark:text-red-300 font-medium">{error.error}</p>
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                        Row: {JSON.stringify(error.row)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
