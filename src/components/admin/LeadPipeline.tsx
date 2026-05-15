import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Plus, Phone, Mail, Clock, Users, Home, GripVertical,
  Search, ChevronLeft, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
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
  notes?: string | null;
  property?: Property;
}

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  targetDays: number;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'novo',           label: 'Novos Leads',    color: 'bg-blue-500',   targetDays: 1  },
  { id: 'contatado',      label: 'Contatados',     color: 'bg-cyan-500',   targetDays: 3  },
  { id: 'qualificado',    label: 'Qualificados',   color: 'bg-purple-500', targetDays: 5  },
  { id: 'visita_agendada',label: 'Visita Agendada',color: 'bg-indigo-500', targetDays: 7  },
  { id: 'visitou',        label: 'Visitou',        color: 'bg-violet-500', targetDays: 5  },
  { id: 'proposta',       label: 'Proposta',       color: 'bg-amber-500',  targetDays: 7  },
  { id: 'negociacao',     label: 'Negociação',     color: 'bg-orange-500', targetDays: 14 },
  { id: 'fechado',        label: 'Fechados',       color: 'bg-green-500',  targetDays: 0  },
];

const ORIGIN_CONFIG: Record<string, { label: string; className: string }> = {
  site:      { label: 'Site',      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' },
  whatsapp:  { label: 'WhatsApp',  className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' },
  manual:    { label: 'Manual',    className: 'bg-muted text-muted-foreground border-border' },
  portal:    { label: 'Portal',    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400' },
};

interface LeadPipelineProps {
  contacts: Contact[];
  onStatusChange: (contactId: string, newStatus: string) => void;
  onAddLead: (status?: string) => void;
  onViewLead: (contact: Contact) => void;
  onCallLead: (contact: Contact) => void;
  onEmailLead: (contact: Contact) => void;
}

const getUrgencyClass = (contact: Contact, targetDays: number): string => {
  if (targetDays === 0) return 'text-muted-foreground';
  const ref = new Date(contact.status_updated_at || contact.created_at);
  const days = Math.floor((Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24));
  if (days > targetDays) return 'text-red-500 font-semibold';
  if (days >= Math.ceil(targetDays * 0.7)) return 'text-amber-500 font-medium';
  return 'text-green-600 dark:text-green-400';
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false);

  const filteredContacts = searchTerm.trim()
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
      )
    : contacts;

  const getLeadsByStage = (stageId: string) =>
    filteredContacts.filter((c) => c.status === stageId);

  const visibleStages = hideEmpty
    ? PIPELINE_STAGES.filter((s) => contacts.filter(c => c.status === s.id).length > 0)
    : PIPELINE_STAGES;

  const getAverageTime = (stageId: string) => {
    const stageContacts = contacts.filter((c) => c.status === stageId);
    if (stageContacts.length === 0) return 0;
    const now = Date.now();
    const total = stageContacts.reduce((acc, c) => {
      const d = new Date(c.status_updated_at || c.created_at);
      return acc + Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(total / stageContacts.length);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-600', 'bg-purple-600', 'bg-green-600',
      'bg-orange-600', 'bg-pink-600', 'bg-indigo-600',
    ];
    return colors[name.charCodeAt(0) % colors.length];
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

  const handleDragLeave = () => setDragOverStage(null);

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

  const handleMoveStage = (e: React.MouseEvent, contact: Contact, direction: 'prev' | 'next') => {
    e.stopPropagation();
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === contact.status);
    const newIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < PIPELINE_STAGES.length) {
      onStatusChange(contact.id, PIPELINE_STAGES[newIdx].id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead no pipeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 shrink-0"
          onClick={() => setHideEmpty((v) => !v)}
        >
          {hideEmpty ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {hideEmpty ? 'Mostrar vazios' : 'Ocultar vazios'}
          </span>
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          Dentro do prazo
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          Atenção
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          Atrasado
        </span>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleStages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          const avgTime = getAverageTime(stage.id);

          return (
            <div
              key={stage.id}
              className={cn(
                'flex-shrink-0 w-[272px] rounded-xl border bg-card transition-colors',
                dragOverStage === stage.id && 'border-foreground bg-muted/60 ring-1 ring-foreground/20'
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column header */}
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', stage.color)} />
                    <span className="font-semibold text-sm">{stage.label}</span>
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => onAddLead(stage.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Média: {avgTime}d</span>
                  {stage.targetDays > 0 && (
                    <span className="opacity-50">/ {stage.targetDays}d meta</span>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 min-h-[160px] max-h-[calc(100vh-420px)] overflow-y-auto space-y-2">
                {stageLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                    <Users className="h-8 w-8 mb-2" />
                    <span className="text-xs">Nenhum lead</span>
                  </div>
                ) : (
                  stageLeads.map((contact) => {
                    const urgencyClass = getUrgencyClass(contact, stage.targetDays);
                    const stageIdx = PIPELINE_STAGES.findIndex((s) => s.id === contact.status);
                    const origin = ORIGIN_CONFIG[contact.origem] ?? {
                      label: contact.origem,
                      className: 'bg-muted text-muted-foreground border-border',
                    };

                    return (
                      <Card
                        key={contact.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, contact)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 border-border/60',
                          draggedContact?.id === contact.id && 'opacity-40 scale-95'
                        )}
                        onClick={() => onViewLead(contact)}
                      >
                        {/* Avatar + name */}
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/30 shrink-0" />
                          <Avatar className={cn('h-8 w-8 shrink-0', getAvatarColor(contact.name))}>
                            <AvatarFallback className="text-[10px] font-bold text-white bg-transparent">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate leading-tight">{contact.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{contact.email}</p>
                          </div>
                        </div>

                        {/* Origin badge */}
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', origin.className)}
                          >
                            {origin.label}
                          </Badge>
                        </div>

                        {/* Property */}
                        {contact.property && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Home className="h-3 w-3 shrink-0" />
                            <span className="truncate">{contact.property.title}</span>
                          </div>
                        )}

                        {/* Notes preview */}
                        {contact.notes && (
                          <p className="mt-1.5 text-[11px] text-muted-foreground italic truncate border-l-2 border-muted-foreground/20 pl-2">
                            {contact.notes}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className={cn('text-[11px]', urgencyClass)}>
                            {formatDistanceToNow(new Date(contact.created_at), {
                              addSuffix: false,
                              locale: ptBR,
                            })}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {/* Stage arrows */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              title="Estágio anterior"
                              disabled={stageIdx === 0}
                              onClick={(e) => handleMoveStage(e, contact, 'prev')}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              title="Próximo estágio"
                              disabled={stageIdx === PIPELINE_STAGES.length - 1}
                              onClick={(e) => handleMoveStage(e, contact, 'next')}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            {contact.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="WhatsApp"
                                onClick={(e) => { e.stopPropagation(); onCallLead(contact); }}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              title="Email"
                              onClick={(e) => { e.stopPropagation(); onEmailLead(contact); }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Column footer */}
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-center gap-1.5 text-muted-foreground hover:text-foreground border border-dashed text-xs h-8"
                  onClick={() => onAddLead(stage.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
