import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Phone, Mail, Clock, Users, Home, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  title: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  property_id: string | null;
  read: boolean;
  created_at: string;
  origem: string;
  status: string;
  status_updated_at: string;
  property?: Property;
}

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  targetDays: number;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'novo', label: 'Novos Leads', color: 'bg-blue-500', bgColor: 'bg-blue-500/10', targetDays: 1 },
  { id: 'contatado', label: 'Contatados', color: 'bg-cyan-500', bgColor: 'bg-cyan-500/10', targetDays: 3 },
  { id: 'qualificado', label: 'Qualificados', color: 'bg-purple-500', bgColor: 'bg-purple-500/10', targetDays: 5 },
  { id: 'visita_agendada', label: 'Visita Agendada', color: 'bg-indigo-500', bgColor: 'bg-indigo-500/10', targetDays: 7 },
  { id: 'visitou', label: 'Visitou', color: 'bg-violet-500', bgColor: 'bg-violet-500/10', targetDays: 5 },
  { id: 'proposta', label: 'Proposta', color: 'bg-amber-500', bgColor: 'bg-amber-500/10', targetDays: 7 },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-500', bgColor: 'bg-orange-500/10', targetDays: 14 },
  { id: 'fechado', label: 'Fechados', color: 'bg-green-500', bgColor: 'bg-green-500/10', targetDays: 0 },
];

interface LeadPipelineProps {
  contacts: Contact[];
  onStatusChange: (contactId: string, newStatus: string) => void;
  onAddLead: (status?: string) => void;
  onViewLead: (contact: Contact) => void;
  onCallLead: (contact: Contact) => void;
  onEmailLead: (contact: Contact) => void;
}

export function LeadPipeline({
  contacts,
  onStatusChange,
  onAddLead,
  onViewLead,
  onCallLead,
  onEmailLead,
}: LeadPipelineProps) {
  const [draggedContact, setDraggedContact] = useState<Contact | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getLeadsByStage = (stageId: string) => {
    return contacts.filter((c) => c.status === stageId);
  };

  const getAverageTime = (stageId: string) => {
    const stageContacts = getLeadsByStage(stageId);
    if (stageContacts.length === 0) return 0;
    
    const now = new Date();
    const totalDays = stageContacts.reduce((acc, c) => {
      const statusDate = new Date(c.status_updated_at || c.created_at);
      const diff = Math.floor((now.getTime() - statusDate.getTime()) / (1000 * 60 * 60 * 24));
      return acc + diff;
    }, 0);
    
    return Math.round(totalDays / stageContacts.length);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-indigo-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleDragStart = (e: React.DragEvent, contact: Contact) => {
    setDraggedContact(contact);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', contact.id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedContact && draggedContact.status !== stageId) {
      onStatusChange(draggedContact.id, stageId);
    }
    setDraggedContact(null);
  };

  const handleDragEnd = () => {
    setDraggedContact(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        const avgTime = getAverageTime(stage.id);

        return (
          <div
            key={stage.id}
            className={cn(
              'flex-shrink-0 w-[280px] rounded-xl border bg-card transition-colors',
              dragOverStage === stage.id && 'border-primary bg-primary/5'
            )}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
                  <span className="font-medium text-sm">{stage.label}</span>
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onAddLead(stage.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Média: {avgTime}d</span>
                {stage.targetDays > 0 && (
                  <span className="text-muted-foreground/60">/ {stage.targetDays}d meta</span>
                )}
              </div>
            </div>

            {/* Cards */}
            <div className="p-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
              {stageLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mb-2 opacity-30" />
                  <span className="text-sm">Nenhum lead</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {stageLeads.map((contact) => (
                    <Card
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
                        draggedContact?.id === contact.id && 'opacity-50'
                      )}
                      onClick={() => onViewLead(contact)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1 text-muted-foreground cursor-grab">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <Avatar className={cn('h-9 w-9', getAvatarColor(contact.name))}>
                          <AvatarFallback className="text-xs text-white bg-transparent">
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        </div>
                      </div>

                      {contact.property && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Home className="h-3 w-3" />
                          <span className="truncate">{contact.property.title}</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.created_at), {
                            addSuffix: false,
                            locale: ptBR,
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          {contact.phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCallLead(contact);
                              }}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEmailLead(contact);
                            }}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground border border-dashed"
                onClick={() => onAddLead(stage.id)}
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
