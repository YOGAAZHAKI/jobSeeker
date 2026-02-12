import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ResumeUploaderProps {
  onUploadComplete: (resumeId: string, extractedSkills: string[]) => void;
}

export const ResumeUploader = ({ onUploadComplete }: ResumeUploaderProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setUploadComplete(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);

    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(40);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Create resume record
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      setProgress(60);
      setUploading(false);
      setAnalyzing(true);

      // Call AI to analyze resume
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeId: resumeData.id },
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        toast.error('Resume uploaded but analysis failed. You can retry later.');
      }

      setProgress(100);
      setAnalyzing(false);
      setUploadComplete(true);

      const extractedSkills = analysisData?.skills || [];
      onUploadComplete(resumeData.id, extractedSkills);
      toast.success('Resume uploaded and analyzed successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload resume');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setUploadComplete(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          Upload Resume
        </CardTitle>
        <CardDescription>
          Upload your resume in PDF or DOCX format for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-accent bg-accent/5'
                : 'border-muted-foreground/25 hover:border-accent hover:bg-accent/5'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse (PDF, DOCX up to 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!uploading && !analyzing && !uploadComplete && (
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {uploadComplete && (
                <CheckCircle2 className="h-6 w-6 text-success" />
              )}
            </div>

            {(uploading || analyzing) && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Analyzing with AI...'}
                </p>
              </div>
            )}

            {!uploadComplete && !uploading && !analyzing && (
              <Button
                onClick={handleUpload}
                className="w-full bg-gradient-accent"
                disabled={uploading || analyzing}
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload & Analyze
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
