import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, AlertCircle, CheckCircle, Trash2, Download } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  filename: string;
  fileType: string;
  chunkCount: number;
  uploadDate: string;
  processedAt?: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export default function DocumentManager() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { toast } = useToast();

  // Fetch documents
  const { data: response, isLoading, error } = useQuery<{documents: Document[]}>({
    queryKey: ['/api/admin/documents'],
  });
  
  const documents = response?.documents || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "Document uploaded",
        description: "Document has been uploaded and is being processed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      return await apiRequest(`/api/admin/documents/${filename}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "Document deleted",
        description: "Document has been removed from the system.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name}: Only PDF, DOCX, and TXT files are supported.`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name}: File size must be less than 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    // Clear input
    event.target.value = '';
  };

  const handleDelete = (filename: string) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteMutation.mutate(filename);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-dark-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-orange-500';
      case 'failed': return 'text-red-500';
      default: return 'text-dark-400';
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load documents</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Documents</span>
          </CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT documents to enhance AI responses with relevant context.
            Maximum file size: 10MB per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-dark-400 mx-auto mb-4" />
            <p className="text-dark-300 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={uploadMutation.isPending}
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploadMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Select Files'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Document Library</span>
            </div>
            <Badge variant="outline" className="text-dark-300">
              {documents.length} documents
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-dark-600 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-dark-700 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-dark-700 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-dark-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dark-300 mb-2">No documents uploaded</h3>
              <p className="text-dark-500">Upload your first document to get started with enhanced AI responses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-dark-600 rounded-lg hover:border-dark-500 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-dark-700 rounded-lg">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-50">{doc.filename}</h4>
                      <div className="flex items-center space-x-4 text-sm text-dark-400">
                        <span>{doc.chunkCount} chunks</span>
                        <Badge variant="outline">
                          {doc.fileType?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        <span>{formatDate(doc.uploadDate)}</span>
                      </div>
                      {doc.status === 'failed' && doc.error && (
                        <p className="text-sm text-red-400 mt-1">{doc.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.filename)}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-300">{item.file.name}</span>
                    <span className={getStatusColor(item.status)}>
                      {item.status}
                    </span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  {item.error && (
                    <p className="text-sm text-red-400">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}