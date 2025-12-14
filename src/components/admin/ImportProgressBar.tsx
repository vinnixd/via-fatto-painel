import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ImportJob {
  id: string;
  status: string;
  total_items: number;
  processed_items: number;
  created_items: number;
  updated_items: number;
  error_count: number;
  created_at: string;
  completed_at: string | null;
}

interface ImportProgressBarProps {
  onComplete?: () => void;
}

const ImportProgressBar = ({ onComplete }: ImportProgressBarProps) => {
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fetch current import job (only if recent - last 5 minutes)
    const fetchCurrentJob = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data } = await supabase
        .from('import_jobs')
        .select('*')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Only show if processing (not cancelled, not old completed jobs)
      if (data && data.status === 'processing') {
        setImportJob(data as ImportJob);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    fetchCurrentJob();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('import-jobs-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'import_jobs',
        },
        (payload) => {
          const job = payload.new as ImportJob;
          
          // Ignore cancelled jobs - hide progress bar immediately
          if (job.status === 'cancelled') {
            setIsVisible(false);
            setImportJob(null);
            return;
          }
          
          setImportJob(job);
          setIsVisible(true);

          if (job.status === 'completed') {
            // Show notification
            toast.success(
              `Importação concluída! ${job.created_items} criados, ${job.updated_items} atualizados`,
              {
                icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                duration: 10000,
              }
            );
            
            // Trigger callback
            if (onComplete) {
              onComplete();
            }

            // Hide after 5 seconds
            setTimeout(() => {
              setIsVisible(false);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onComplete]);

  if (!isVisible || !importJob) {
    return null;
  }

  const progress = importJob.total_items > 0 
    ? Math.round((importJob.processed_items / importJob.total_items) * 100)
    : 0;

  const isCompleted = importJob.status === 'completed';
  const hasErrors = importJob.error_count > 0;

  return (
    <Card className={`border-0 shadow-sm transition-all duration-500 ${
      isCompleted 
        ? hasErrors 
          ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-l-4 border-l-yellow-500'
          : 'bg-gradient-to-r from-green-500/10 to-green-500/5 border-l-4 border-l-green-500'
        : 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-l-4 border-l-blue-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-full ${
            isCompleted 
              ? hasErrors ? 'bg-yellow-500/20' : 'bg-green-500/20'
              : 'bg-blue-500/20'
          }`}>
            {isCompleted ? (
              hasErrors ? (
                <XCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )
            ) : (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">
                {isCompleted ? 'Importação Concluída' : 'Importando Imóveis...'}
              </p>
              <span className={`text-sm font-bold ${
                isCompleted 
                  ? hasErrors ? 'text-yellow-600' : 'text-green-600'
                  : 'text-blue-600'
              }`}>
                {progress}%
              </span>
            </div>
            
            <Progress 
              value={progress} 
              className={`h-2 ${
                isCompleted 
                  ? hasErrors ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                  : '[&>div]:bg-blue-500'
              }`}
            />
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{importJob.processed_items} de {importJob.total_items} processados</span>
              {importJob.created_items > 0 && (
                <span className="text-green-600">+{importJob.created_items} criados</span>
              )}
              {importJob.updated_items > 0 && (
                <span className="text-blue-600">↻{importJob.updated_items} atualizados</span>
              )}
              {importJob.error_count > 0 && (
                <span className="text-red-600">✕{importJob.error_count} erros</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportProgressBar;
