import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  X, 
  Plus, 
  Home, 
  MapPin, 
  DollarSign, 
  Bed, 
  Bath, 
  Car, 
  Maximize, 
  Star,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Check,
  GripVertical,
  RefreshCw,
  Settings2,
  Share2,
  ExternalLink,
  Save,
  Send,
  Info,
  Clock,
  Copy,
  Pencil,
  Shield,
  Dumbbell,
  Wrench,
  HelpCircle,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/lib/imageCompression';
import type { Database } from '@/integrations/supabase/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type PropertyStatus = Database['public']['Enums']['property_status'];
type PropertyType = Database['public']['Enums']['property_type'];
type PropertyProfile = Database['public']['Enums']['property_profile'];
type DocumentationStatus = Database['public']['Enums']['documentation_status'];
type PropertyCondition = Database['public']['Enums']['property_condition'];

interface PropertyImage {
  id?: string;
  url: string;
  alt: string;
  order_index: number;
  file?: File;
  isNew?: boolean;
}

type LocationType = 'exact' | 'approximate' | 'hidden';

interface FormData {
  title: string;
  slug: string;
  description: string;
  price: number | '';
  condo_fee: number | '';
  condo_exempt: boolean;
  iptu: number | '';
  status: PropertyStatus;
  type: PropertyType;
  profile: PropertyProfile;
  condition: PropertyCondition | null;
  address_street: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zipcode: string;
  location_type: LocationType;
  bedrooms: number | '';
  suites: number | '';
  bathrooms: number | '';
  garages: number | '';
  area: number | '';
  built_area: number | '';
  financing: boolean;
  documentation: DocumentationStatus;
  featured: boolean;
  active: boolean;
  features: string[];
  amenities: string[];
  reference: string;
  category_id: string;
  seo_title: string;
  seo_description: string;
  integrar_portais: boolean;
}

// Sortable Image Component for drag-and-drop
interface SortableImageProps {
  image: PropertyImage;
  index: number;
  onRemove: (index: number) => void;
}

const SortableImage = ({ image, index, onRemove }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id || `new-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square rounded-xl overflow-hidden bg-muted ring-2 ${
        isDragging ? 'ring-primary shadow-lg' : 'ring-transparent hover:ring-primary/50'
      } transition-all`}
    >
      <img
        src={image.url}
        alt={image.alt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 rounded-md bg-black/50 text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Index number */}
      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center font-medium">
        {index + 1}
      </div>

      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <X className="h-4 w-4" />
      </Button>
      {index === 0 && (
        <span className="absolute bottom-2 left-2 bg-foreground text-background text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
          <Camera className="h-3 w-3" />
          Foto de capa
        </span>
      )}
    </div>
  );
};

// Feature groups
const featureGroups = {
  'Lazer': ['Piscina', 'Churrasqueira', 'Área Gourmet', 'Salão de Festas', 'Playground', 'Academia', 'Quadra', 'SPA', 'Sauna'],
  'Segurança': ['Segurança 24h', 'Portaria', 'Câmeras', 'Interfone', 'Cerca Elétrica', 'Alarme'],
  'Infraestrutura': ['Elevador', 'Ar Condicionado', 'Aquecimento', 'Gerador', 'Gás Encanado', 'Água Quente'],
  'Conforto': ['Closet', 'Cozinha Americana', 'Despensa', 'Escritório', 'Varanda', 'Jardim', 'Lavabo'],
};

const featureGroupIcons: Record<string, typeof Shield> = {
  'Lazer': Dumbbell,
  'Segurança': Shield,
  'Infraestrutura': Wrench,
  'Conforto': Home,
};

const PropertyFormPage = () => {
  const { id } = useParams();
  const { navigateAdmin } = useAdminNavigation();
  const { user } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [isImprovingTitle, setIsImprovingTitle] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [activePortalsCount, setActivePortalsCount] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSlugEditable, setIsSlugEditable] = useState(false);
  const [descriptionTone, setDescriptionTone] = useState<string | null>(null);

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Unsaved changes - warn on browser close/refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);


  // CEP lookup function
  const handleCepLookup = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLookingUpCep(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-cep', {
        body: { cep: cleanCep }
      });

      if (error) throw error;

      if (data?.success && data?.address) {
        setFormData(prev => ({
          ...prev,
          address_street: data.address.street || prev.address_street,
          address_neighborhood: data.address.neighborhood || prev.address_neighborhood,
          address_city: data.address.city || prev.address_city,
          address_state: data.address.state || prev.address_state,
          address_zipcode: data.address.zipcode || prev.address_zipcode,
        }));
        toast.success('Endereço preenchido automaticamente!');
      }
    } catch (err: any) {
      console.error('CEP lookup error:', err);
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        toast.error('CEP não encontrado');
      }
    } finally {
      setIsLookingUpCep(false);
    }
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `new-${items.indexOf(item)}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `new-${items.indexOf(item)}`) === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, idx) => ({ ...item, order_index: idx }));
      });
    }
  };
  
  const steps = [
    { id: 'basic', title: 'Informações Básicas', icon: Home },
    { id: 'location', title: 'Localização', icon: MapPin },
    { id: 'specs', title: 'Especificações', icon: Maximize },
    { id: 'features', title: 'Características', icon: Sparkles },
    { id: 'images', title: 'Galeria', icon: ImageIcon },
    { id: 'seo', title: 'SEO', icon: Settings2 },
  ];

  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    description: '',
    price: '',
    condo_fee: '',
    condo_exempt: false,
    iptu: '',
    status: 'venda',
    type: 'casa',
    profile: 'residencial',
    condition: null,
    address_street: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zipcode: '',
    location_type: 'approximate',
    bedrooms: '',
    suites: '',
    bathrooms: '',
    garages: '',
    area: '',
    built_area: '',
    financing: false,
    documentation: 'regular',
    featured: false,
    active: true,
    features: [],
    amenities: [],
    reference: '',
    category_id: '',
    seo_title: '',
    seo_description: '',
    integrar_portais: false,
  });

  // Calculate progress
  const progressPercentage = useMemo(() => {
    const requiredChecks = [
      !!formData.title,
      !!formData.type,
      !!formData.status,
      formData.price !== '' && Number(formData.price) > 0,
      !!formData.address_city,
      !!formData.address_state,
      formData.bedrooms !== '' && Number(formData.bedrooms) >= 0,
      formData.area !== '' && Number(formData.area) > 0,
      !!formData.description,
      images.length > 0,
    ];
    const filled = requiredChecks.filter(Boolean).length;
    return Math.round((filled / requiredChecks.length) * 100);
  }, [formData, images]);

  // Tab completion status
  const tabStatus = useMemo(() => {
    const basicComplete = !!formData.title && !!formData.type && !!formData.status && formData.price !== '' && Number(formData.price) > 0 && !!formData.description;
    const locationComplete = !!formData.address_city && !!formData.address_state;
    const specsComplete = formData.bedrooms !== '' && formData.area !== '' && Number(formData.area) > 0;
    const featuresComplete = formData.features.length > 0;
    const imagesComplete = images.length > 0;
    const seoComplete = !!formData.seo_title && !!formData.seo_description;

    const basicStarted = !!formData.title || formData.price !== '' || !!formData.description;
    const locationStarted = !!formData.address_street || !!formData.address_city || !!formData.address_zipcode;
    const specsStarted = formData.bedrooms !== '' || formData.area !== '';
    const seoStarted = !!formData.seo_title || !!formData.seo_description;

    return [
      basicComplete ? 'complete' : basicStarted ? 'in-progress' : 'pending',
      locationComplete ? 'complete' : locationStarted ? 'in-progress' : 'pending',
      specsComplete ? 'complete' : specsStarted ? 'in-progress' : 'pending',
      featuresComplete ? 'complete' : 'pending',
      imagesComplete ? 'complete' : 'pending',
      seoComplete ? 'complete' : seoStarted ? 'in-progress' : 'pending',
    ] as Array<'complete' | 'in-progress' | 'pending'>;
  }, [formData, images]);

  // Word counter for description
  const descriptionWordCount = useMemo(() => {
    if (!formData.description) return 0;
    return formData.description.trim().split(/\s+/).filter(Boolean).length;
  }, [formData.description]);

  // Track unsaved changes
  useEffect(() => {
    if (initialDataLoaded || !isEditing) {
      setHasUnsavedChanges(true);
    }
  }, [formData, images]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name');
      setCategories(data || []);
    };
    fetchCategories();
    
    const fetchActivePortals = async () => {
      const { count } = await supabase
        .from('portais')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      setActivePortalsCount(count || 0);
    };
    fetchActivePortals();
  }, []);

  useEffect(() => {
    if (isEditing) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        title: property.title || '',
        slug: property.slug || '',
        description: property.description || '',
        price: property.price || '',
        condo_fee: property.condo_fee || '',
        condo_exempt: property.condo_exempt || false,
        iptu: property.iptu || '',
        status: property.status,
        type: property.type,
        profile: property.profile,
        condition: property.condition || null,
        address_street: property.address_street || '',
        address_neighborhood: property.address_neighborhood || '',
        address_city: property.address_city || '',
        address_state: property.address_state || '',
        address_zipcode: property.address_zipcode || '',
        location_type: (property.location_type as LocationType) || 'approximate',
        bedrooms: property.bedrooms ?? '',
        suites: property.suites ?? '',
        bathrooms: property.bathrooms ?? '',
        garages: property.garages ?? '',
        area: property.area || '',
        built_area: property.built_area || '',
        financing: property.financing || false,
        documentation: property.documentation,
        featured: property.featured || false,
        active: property.active !== false,
        features: property.features || [],
        amenities: property.amenities || [],
        reference: property.reference || '',
        category_id: property.category_id || '',
        seo_title: property.seo_title || '',
        seo_description: property.seo_description || '',
        integrar_portais: property.integrar_portais || false,
      });

      const { data: propertyImages } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id)
        .order('order_index');

      setImages(propertyImages || []);
      setInitialDataLoaded(true);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Erro ao carregar imóvel');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
    return slug || `imovel-${Date.now()}`;
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: isSlugEditable ? prev.slug : generateSlug(value),
    }));
  };

  // Generate title with AI
  const handleGenerateTitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-title', {
        body: {
          title: formData.title || 'Novo imóvel',
          propertyInfo: {
            type: formData.type,
            status: formData.status,
            bedrooms: formData.bedrooms || 0,
            suites: formData.suites || 0,
            garages: formData.garages || 0,
            area: formData.area || 0,
            neighborhood: formData.address_neighborhood,
            city: formData.address_city,
            features: formData.features,
          }
        }
      });
      
      if (error) throw error;
      if (data?.improvedTitle) {
        handleTitleChange(data.improvedTitle);
        toast.success('Título gerado com IA!');
      }
    } catch (err: any) {
      console.error('Error generating title:', err);
      toast.error(err.message || 'Erro ao gerar título');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Generate SEO with AI
  const handleGenerateSeo = async () => {
    if (!formData.title || !formData.address_city) {
      toast.error('Preencha título e cidade antes de gerar SEO');
      return;
    }

    setIsGeneratingSeo(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo', {
        body: {
          propertyInfo: {
            title: formData.title,
            type: formData.type,
            status: formData.status,
            city: formData.address_city,
            state: formData.address_state,
            neighborhood: formData.address_neighborhood,
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            garages: formData.garages,
            area: formData.area,
            price: formData.price,
            features: formData.features,
          },
        },
      });

      if (error) throw error;

      if (data?.seo_title || data?.seo_description) {
        setFormData(prev => ({
          ...prev,
          seo_title: data.seo_title || prev.seo_title,
          seo_description: data.seo_description || prev.seo_description,
        }));
        toast.success('SEO gerado com sucesso!');
      } else {
        throw new Error('Resposta inválida da IA');
      }
    } catch (err: any) {
      console.error('SEO generation error:', err);
      toast.error(err.message || 'Erro ao gerar SEO');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const COMPRESSION_THRESHOLD_MB = 5;
  const COMPRESSION_THRESHOLD_BYTES = COMPRESSION_THRESHOLD_MB * 1024 * 1024;

  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageUpload = useCallback(async (files: FileList) => {
    const filesToProcess = Array.from(files);

    const needsCompression = filesToProcess.some(f => f.size > COMPRESSION_THRESHOLD_BYTES);
    if (needsCompression) {
      setIsCompressing(true);
      toast.info('Comprimindo imagens grandes...');
    }

    const newImages: PropertyImage[] = [];
    let compressedCount = 0;
    
    for (let i = 0; i < filesToProcess.length; i++) {
      let file = filesToProcess[i];
      
      if (file.size > COMPRESSION_THRESHOLD_BYTES) {
        try {
          const originalSize = file.size;
          file = await compressImage(file, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.85,
            maxSizeKB: 4500,
          });
          
          if (file.size < originalSize) {
            compressedCount++;
          }
          
          if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(`"${filesToProcess[i].name}" ainda excede ${MAX_FILE_SIZE_MB}MB após compressão`);
            continue;
          }
        } catch (error) {
          console.error('Compression error:', error);
          toast.error(`Erro ao comprimir "${file.name}"`);
          continue;
        }
      }
      
      const url = URL.createObjectURL(file);
      newImages.push({
        url,
        alt: file.name,
        order_index: images.length + newImages.length,
        file,
        isNew: true,
      });
    }

    setIsCompressing(false);

    if (newImages.length > 0) {
      setImages([...images, ...newImages]);
      if (compressedCount > 0) {
        toast.success(`${newImages.length} imagem(ns) adicionada(s), ${compressedCount} comprimida(s)`);
      } else {
        toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
      }
    }
  }, [images]);

  const removeImage = (index: number) => {
    const newImages = [...images];
    if (newImages[index].isNew && newImages[index].url.startsWith('blob:')) {
      URL.revokeObjectURL(newImages[index].url);
    }
    newImages.splice(index, 1);
    newImages.forEach((img, i) => img.order_index = i);
    setImages(newImages);
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f !== feature),
    });
  };

  const buildPropertyData = () => ({
    title: formData.title,
    slug: formData.slug || generateSlug(formData.title) || `imovel-${Date.now()}`,
    description: formData.description,
    price: Number(formData.price) || 0,
    condo_fee: formData.condo_exempt ? 0 : Number(formData.condo_fee) || 0,
    condo_exempt: formData.condo_exempt,
    iptu: Number(formData.iptu) || 0,
    status: formData.status,
    type: formData.type,
    profile: formData.profile,
    condition: formData.condition,
    address_street: formData.address_street,
    address_neighborhood: formData.address_neighborhood,
    address_city: formData.address_city,
    address_state: formData.address_state,
    address_zipcode: formData.address_zipcode,
    location_type: formData.location_type,
    bedrooms: Number(formData.bedrooms) || 0,
    suites: Number(formData.suites) || 0,
    bathrooms: Number(formData.bathrooms) || 0,
    garages: Number(formData.garages) || 0,
    area: Number(formData.area) || 0,
    built_area: formData.built_area ? Number(formData.built_area) : null,
    financing: formData.financing,
    documentation: formData.documentation,
    featured: formData.featured,
    active: formData.active,
    features: formData.features,
    amenities: formData.amenities,
    reference: formData.reference,
    category_id: formData.category_id || null,
    seo_title: formData.seo_title || null,
    seo_description: formData.seo_description || null,
    integrar_portais: formData.integrar_portais,
    created_by: user?.id,
  });

  // Autosave every 30 seconds for editing mode
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges || !id) return;

    const timer = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        const propertyData = buildPropertyData();
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id);
        
        if (!error) {
          setAutoSaveStatus('saved');
          setLastAutoSave(new Date());
          setHasUnsavedChanges(false);
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [isEditing, hasUnsavedChanges, formData, id]);

  const handleSaveImages = async (propertyId: string) => {
    if (isEditing) {
      const currentImageIds = images.filter(img => img.id).map(img => img.id);
      const { data: existingImages } = await supabase
        .from('property_images')
        .select('id, url')
        .eq('property_id', propertyId);

      const imagesToDelete = (existingImages || []).filter(
        existing => !currentImageIds.includes(existing.id)
      );

      if (imagesToDelete.length > 0) {
        const storagePaths = imagesToDelete
          .map(img => img.url.split('/property-images/')[1])
          .filter(Boolean);

        if (storagePaths.length > 0) {
          await supabase.storage.from('property-images').remove(storagePaths);
        }
        const idsToDelete = imagesToDelete.map(img => img.id);
        await supabase.from('property_images').delete().in('id', idsToDelete);
      }

      const existingImagesToUpdate = images.filter(img => img.id);
      if (existingImagesToUpdate.length > 0) {
        await Promise.all(
          existingImagesToUpdate.map(image =>
            supabase
              .from('property_images')
              .update({ order_index: image.order_index })
              .eq('id', image.id)
          )
        );
      }
    }

    const newImagesToUpload = images.filter(img => img.isNew && img.file);
    const uploadPromises = newImagesToUpload.map(async (img, index) => {
      if (!img.file) return null;
      const compressedFile = await compressImage(img.file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 });
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      return {
        property_id: propertyId,
        url: urlData.publicUrl,
        alt: img.alt,
        order_index: img.order_index,
      };
    });

    const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);
    if (uploadedImages.length > 0) {
      await supabase.from('property_images').insert(uploadedImages);
    }
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    
    if (asDraft) {
      setSavingDraft(true);
    } else {
      setSaving(true);
    }

    try {
      if (!formData.title || !formData.address_city || !formData.address_state) {
        toast.error('Preencha os campos obrigatórios: título, cidade e estado');
        setSaving(false);
        setSavingDraft(false);
        return;
      }

      const propertyData = {
        ...buildPropertyData(),
        active: asDraft ? false : formData.active,
      };

      let propertyId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select('id')
          .single();
        if (error) throw error;
        propertyId = data.id;
      }

      await handleSaveImages(propertyId!);

      setHasUnsavedChanges(false);
      
      if (asDraft) {
        toast.success('Rascunho salvo com sucesso!');
      } else {
        toast.success(isEditing ? 'Imóvel atualizado com sucesso!' : 'Imóvel cadastrado e publicado!');
      }
      
      navigateAdmin('/admin/imoveis');
    } catch (error: any) {
      console.error('Error saving property:', error);
      if (error?.code === '23505') {
        toast.error('Já existe um imóvel com este slug. Altere o título.');
      } else if (error?.message) {
        toast.error(`Erro ao salvar: ${error.message}`);
      } else {
        toast.error('Erro ao salvar imóvel. Verifique os dados e tente novamente.');
      }
    } finally {
      setSaving(false);
      setSavingDraft(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="p-6">
          <Button variant="ghost" onClick={() => {
            if (hasUnsavedChanges) {
              setShowUnsavedDialog(true);
              setPendingNavigation(() => () => navigateAdmin('/admin/imoveis'));
            } else {
              navigateAdmin('/admin/imoveis');
            }
          }} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>

          {/* Progress Bar */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}</h2>
                <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'} className="text-xs">
                  {progressPercentage}% concluído
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Salvando...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Salvo automaticamente
                  </span>
                )}
                {lastAutoSave && autoSaveStatus === 'idle' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Salvo às {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>

          <div>
            {/* Tabs Navigation */}
            <div className="mb-6 border-b border-border overflow-x-auto">
              <nav className="flex gap-1 min-w-max">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = activeStep === index;
                  const status = tabStatus[index];
                  
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveStep(index);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                        isActive 
                          ? 'border-foreground text-foreground' 
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      {status === 'complete' ? (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : status === 'in-progress' ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span>{step.title}</span>
                      {step.id === 'images' && images.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{images.length}</Badge>
                      )}
                      {step.id === 'features' && formData.features.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{formData.features.length}</Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div>
              <form 
                onSubmit={(e) => handleSubmit(e)} 
                className="space-y-6"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
              >
                {/* Step 0: Basic Info */}
                {activeStep === 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-foreground/70" />
                        Informações Básicas
                      </CardTitle>
                      <CardDescription>
                        Dados principais do imóvel
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Identificação */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Identificação
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-6 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="title">Título do Anúncio *</Label>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleGenerateTitle}
                                  disabled={isGeneratingTitle}
                                  className="h-6 px-2 gap-1 text-xs"
                                >
                                  {isGeneratingTitle ? (
                                    <><Loader2 className="h-3 w-3 animate-spin" />Gerando...</>
                                  ) : (
                                    <><Sparkles className="h-3 w-3" />Gerar título otimizado</>
                                  )}
                                </Button>
                                {formData.title && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      setIsImprovingTitle(true);
                                      try {
                                        const { data, error } = await supabase.functions.invoke('improve-title', {
                                          body: {
                                            title: formData.title,
                                            propertyInfo: {
                                              type: formData.type,
                                              status: formData.status,
                                              bedrooms: formData.bedrooms || 0,
                                              suites: formData.suites || 0,
                                              garages: formData.garages || 0,
                                              area: formData.area || 0,
                                              neighborhood: formData.address_neighborhood,
                                              city: formData.address_city,
                                              features: formData.features,
                                            }
                                          }
                                        });
                                        if (error) throw error;
                                        if (data?.improvedTitle) {
                                          handleTitleChange(data.improvedTitle);
                                          toast.success('Título melhorado com IA!');
                                        }
                                      } catch (err: any) {
                                        toast.error(err.message || 'Erro ao melhorar título');
                                      } finally {
                                        setIsImprovingTitle(false);
                                      }
                                    }}
                                    disabled={isImprovingTitle}
                                    className="h-6 px-2 gap-1 text-xs"
                                  >
                                    {isImprovingTitle ? (
                                      <><Loader2 className="h-3 w-3 animate-spin" />Melhorando...</>
                                    ) : (
                                      <><RefreshCw className="h-3 w-3" />Melhorar</>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                            <Input
                              id="title"
                              value={formData.title}
                              onChange={(e) => handleTitleChange(e.target.value)}
                              placeholder="Ex: Casa à venda no Lago Sul com 3 suítes e área gourmet"
                              className="h-11"
                              required
                            />
                          </div>
                          <div className="lg:col-span-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="slug">URL Amigável</Label>
                              {!isSlugEditable ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setIsSlugEditable(true)}
                                  className="h-6 px-2 gap-1 text-xs"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Editar
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setIsSlugEditable(false);
                                    setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
                                  }}
                                  className="h-6 px-2 gap-1 text-xs"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  Auto
                                </Button>
                              )}
                            </div>
                            <Input
                              id="slug"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              placeholder="casa-3-quartos-centro"
                              className="h-11 font-mono text-sm"
                              disabled={!isSlugEditable}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Classificação */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Home className="h-4 w-4" />
                          Classificação
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Status *</Label>
                            <Select value={formData.status} onValueChange={(v: PropertyStatus) => setFormData({ ...formData, status: v })}>
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="venda">À Venda</SelectItem>
                                <SelectItem value="aluguel">Aluguel</SelectItem>
                                <SelectItem value="vendido">Vendido</SelectItem>
                                <SelectItem value="alugado">Alugado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo de Imóvel *</Label>
                            <Select value={formData.type} onValueChange={(v: PropertyType) => setFormData({ ...formData, type: v })}>
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="casa">Casa</SelectItem>
                                <SelectItem value="apartamento">Apartamento</SelectItem>
                                <SelectItem value="terreno">Terreno</SelectItem>
                                <SelectItem value="comercial">Comercial</SelectItem>
                                <SelectItem value="rural">Rural</SelectItem>
                                <SelectItem value="cobertura">Cobertura</SelectItem>
                                <SelectItem value="flat">Flat</SelectItem>
                                <SelectItem value="galpao">Galpão</SelectItem>
                                <SelectItem value="loft">Loft</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Perfil</Label>
                            <Select value={formData.profile} onValueChange={(v: PropertyProfile) => setFormData({ ...formData, profile: v })}>
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="residencial">Residencial</SelectItem>
                                <SelectItem value="comercial">Comercial</SelectItem>
                                <SelectItem value="industrial">Industrial</SelectItem>
                                <SelectItem value="misto">Misto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Condição</Label>
                            <Select 
                              value={formData.condition || 'none'} 
                              onValueChange={(v) => setFormData({ ...formData, condition: v === 'none' ? null : v as PropertyCondition })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem condição</SelectItem>
                                <SelectItem value="lancamento">Lançamento</SelectItem>
                                <SelectItem value="pronto_para_morar">Pronto para Morar</SelectItem>
                                <SelectItem value="novo">Novo</SelectItem>
                                <SelectItem value="usado">Usado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Valores */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Valores
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Estes valores são usados em filtros, portais e SEO</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Preço (R$) *</Label>
                            <Input
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                              placeholder="850.000"
                              className="h-11 text-lg font-semibold"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Condomínio (R$)</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                value={formData.condo_exempt ? '' : formData.condo_fee}
                                onChange={(e) => setFormData({ ...formData, condo_fee: e.target.value === '' ? '' : Number(e.target.value) })}
                                placeholder="800"
                                className="h-11"
                                disabled={formData.condo_exempt}
                              />
                              <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 shrink-0">
                                <Switch
                                  id="condo_exempt"
                                  checked={formData.condo_exempt}
                                  onCheckedChange={(checked) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      condo_exempt: checked,
                                      condo_fee: checked ? '' : prev.condo_fee,
                                    }))
                                  }
                                />
                                <Label
                                  htmlFor="condo_exempt"
                                  className="text-xs cursor-pointer whitespace-nowrap leading-none"
                                >
                                  Isento
                                </Label>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>IPTU (R$/ano)</Label>
                            <Input
                              type="number"
                              value={formData.iptu}
                              onChange={(e) => setFormData({ ...formData, iptu: e.target.value === '' ? '' : Number(e.target.value) })}
                              placeholder="3.500"
                              className="h-11"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Descrição
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Tone selector */}
                            <div className="flex gap-1">
                              {[
                                { key: 'luxo', label: '✨ Luxo' },
                                { key: 'padrao', label: '📝 Padrão' },
                                { key: 'investimento', label: '📊 Investimento' },
                              ].map(tone => (
                                <Button
                                  key={tone.key}
                                  type="button"
                                  variant={descriptionTone === tone.key ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={() => setDescriptionTone(descriptionTone === tone.key ? null : tone.key)}
                                >
                                  {tone.label}
                                </Button>
                              ))}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async (e) => {
                                e.preventDefault();
                                setIsImprovingDescription(true);
                                try {
                                  const { data, error } = await supabase.functions.invoke('improve-description', {
                                    body: {
                                      description: formData.description,
                                      tone: descriptionTone || 'padrao',
                                      propertyInfo: {
                                        type: formData.type,
                                        status: formData.status,
                                        bedrooms: formData.bedrooms || 0,
                                        suites: formData.suites || 0,
                                        bathrooms: formData.bathrooms || 0,
                                        garages: formData.garages || 0,
                                        area: formData.area || 0,
                                        neighborhood: formData.address_neighborhood,
                                        city: formData.address_city,
                                        features: formData.features,
                                      }
                                    }
                                  });
                                  
                                  if (error) throw error;
                                  if (data?.improvedDescription) {
                                    setFormData({ ...formData, description: data.improvedDescription });
                                    toast.success('Descrição gerada com IA!');
                                  }
                                } catch (err: any) {
                                  toast.error(err.message || 'Erro ao gerar descrição');
                                } finally {
                                  setIsImprovingDescription(false);
                                }
                              }}
                              disabled={isImprovingDescription}
                              className="gap-2"
                            >
                              {isImprovingDescription ? (
                                <><Loader2 className="h-4 w-4 animate-spin" />Gerando...</>
                              ) : (
                                <><Sparkles className="h-4 w-4" />{formData.description ? 'Melhorar com IA' : 'Gerar descrição com IA'}</>
                              )}
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Descreva o imóvel com detalhes: características, diferenciais, localização..."
                          rows={6}
                          className="resize-none"
                        />
                        <div className="flex justify-end">
                          <span className="text-xs text-muted-foreground">
                            {descriptionWordCount} {descriptionWordCount === 1 ? 'palavra' : 'palavras'}
                          </span>
                        </div>
                      </div>

                      {/* Opções */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Settings2 className="h-4 w-4" />
                          Opções de Exibição
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.active ? 'border-foreground bg-muted' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                          >
                            <div className="flex items-center gap-2">
                              <Check className={`h-4 w-4 ${formData.active ? 'text-foreground' : 'text-muted-foreground'}`} />
                              <div className="text-left">
                                <p className="font-medium text-sm">Ativo</p>
                                <p className="text-xs text-muted-foreground">Visível no site</p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${formData.active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
                              {formData.active ? 'Sim' : 'Não'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.featured ? 'border-yellow-500 bg-yellow-500/10' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                          >
                            <div className="flex items-center gap-2">
                              <Star className={`h-4 w-4 ${formData.featured ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                              <div className="text-left">
                                <p className="font-medium text-sm">Destaque</p>
                                <p className="text-xs text-muted-foreground">Página inicial</p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${formData.featured ? 'bg-yellow-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                              {formData.featured ? 'Sim' : 'Não'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.financing ? 'border-green-500 bg-green-500/10' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, financing: !prev.financing }))}
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className={`h-4 w-4 ${formData.financing ? 'text-green-500' : 'text-muted-foreground'}`} />
                              <div className="text-left">
                                <p className="font-medium text-sm">Financiamento</p>
                                <p className="text-xs text-muted-foreground">Aceita financiar</p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${formData.financing ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                              {formData.financing ? 'Sim' : 'Não'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Integração com Portais */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Share2 className="h-4 w-4" />
                          Integração com Portais
                        </div>
                        <div 
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            formData.integrar_portais 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-border bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, integrar_portais: !prev.integrar_portais }))}
                        >
                          <div className="flex items-center gap-3">
                            <Share2 className={`h-5 w-5 ${formData.integrar_portais ? 'text-blue-500' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="font-medium">Integrar com Portais</p>
                              <p className="text-sm text-muted-foreground">
                                Exportar para portais imobiliários (ZAP, OLX, VivaReal, etc.)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={formData.integrar_portais}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, integrar_portais: checked }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {activePortalsCount > 0 ? (
                            <>
                              <span className="text-muted-foreground">Portais ativos:</span>
                              <Badge variant="secondary">{activePortalsCount}</Badge>
                            </>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-2">
                              <ExternalLink className="h-3 w-3" />
                              Nenhum portal ativo. Ative em{' '}
                              <button 
                                type="button"
                                onClick={() => navigateAdmin('/admin/portais')}
                                className="text-primary hover:underline"
                              >
                                Configurações → Portais
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 1: Location */}
                {activeStep === 1 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Localização
                      </CardTitle>
                      <CardDescription>
                        Endereço completo do imóvel
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* CEP first for auto-fill */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="address_zipcode">CEP</Label>
                          <div className="relative">
                            <Input
                              id="address_zipcode"
                              value={formData.address_zipcode}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData({ ...formData, address_zipcode: value });
                                const cleanCep = value.replace(/\D/g, '');
                                if (cleanCep.length === 8) {
                                  handleCepLookup(value);
                                }
                              }}
                              onBlur={(e) => handleCepLookup(e.target.value)}
                              placeholder="00000-000"
                              className="h-12 pr-10"
                            />
                            {isLookingUpCep && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Digite o CEP para preencher automaticamente</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="address_street">Logradouro</Label>
                          <Input
                            id="address_street"
                            value={formData.address_street}
                            onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                            placeholder="Rua, Avenida, etc."
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address_neighborhood">Bairro</Label>
                          <Input
                            id="address_neighborhood"
                            value={formData.address_neighborhood}
                            onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                            placeholder="Nome do bairro"
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address_city">Cidade *</Label>
                          <Input
                            id="address_city"
                            value={formData.address_city}
                            onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                            placeholder="Nome da cidade"
                            className="h-12"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address_state">Estado *</Label>
                          <Input
                            id="address_state"
                            value={formData.address_state}
                            onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                            placeholder="Ex: DF, SP, RJ"
                            className="h-12"
                            required
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Exibição da Localização no Mapa
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Escolha como a localização será exibida na página do imóvel
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div
                            onClick={() => setFormData({ ...formData, location_type: 'exact' })}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                              formData.location_type === 'exact'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.location_type === 'exact' ? 'border-primary' : 'border-muted-foreground'
                              }`}>
                                {formData.location_type === 'exact' && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium">Exata</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-7">
                              Mostra o marcador no endereço exato do imóvel
                            </p>
                          </div>
                          <div
                            onClick={() => setFormData({ ...formData, location_type: 'approximate' })}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                              formData.location_type === 'approximate'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.location_type === 'approximate' ? 'border-primary' : 'border-muted-foreground'
                              }`}>
                                {formData.location_type === 'approximate' && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium">Aproximada</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-7">
                              Mostra uma área aproximada, protegendo a privacidade
                            </p>
                          </div>
                          <div
                            onClick={() => setFormData({ ...formData, location_type: 'hidden' })}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                              formData.location_type === 'hidden'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.location_type === 'hidden' ? 'border-primary' : 'border-muted-foreground'
                              }`}>
                                {formData.location_type === 'hidden' && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium">Não mostrar</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-7">
                              O mapa não será exibido na página do imóvel
                            </p>
                          </div>
                        </div>
                        {formData.location_type === 'approximate' && (
                          <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                            <Info className="h-3 w-3" />
                            Recomendado para imóveis residenciais, protegendo a privacidade do proprietário.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Specifications */}
                {activeStep === 2 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Maximize className="h-5 w-5 text-primary" />
                        Especificações
                      </CardTitle>
                      <CardDescription>
                        Detalhes técnicos do imóvel
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            Quartos
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.bedrooms}
                            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Ex: 3"
                            className="h-12 text-center text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            Suítes
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.suites}
                            onChange={(e) => setFormData({ ...formData, suites: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Ex: 1"
                            className="h-12 text-center text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Bath className="h-4 w-4 text-muted-foreground" />
                            Banheiros
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.bathrooms}
                            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Ex: 2"
                            className="h-12 text-center text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            Vagas
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.garages}
                            onChange={(e) => setFormData({ ...formData, garages: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Ex: 2"
                            className="h-12 text-center text-lg"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Maximize className="h-4 w-4 text-muted-foreground" />
                            Área Total (m²)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Inclui a área total do terreno</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Ex: 250"
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Maximize className="h-4 w-4 text-muted-foreground" />
                            Área Construída (m²)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Somente a área edificada</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.built_area}
                            onChange={(e) => setFormData({ ...formData, built_area: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Ex: 180"
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Documentação</Label>
                        <Select value={formData.documentation} onValueChange={(v: DocumentationStatus) => setFormData({ ...formData, documentation: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="irregular">Irregular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Features */}
                {activeStep === 3 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Características
                      </CardTitle>
                      <CardDescription>
                        Diferenciais e comodidades do imóvel
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Grouped features */}
                      {Object.entries(featureGroups).map(([groupName, groupFeatures]) => {
                        const GroupIcon = featureGroupIcons[groupName] || Home;
                        return (
                          <div key={groupName} className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm">
                              <GroupIcon className="h-4 w-4 text-muted-foreground" />
                              {groupName}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {groupFeatures.map((feature) => {
                                const isSelected = formData.features.includes(feature);
                                return (
                                  <button
                                    key={feature}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        removeFeature(feature);
                                      } else {
                                        setFormData({
                                          ...formData,
                                          features: [...formData.features, feature],
                                        });
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                                    {feature}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      <Separator />

                      <div className="space-y-3">
                        <Label>Adicionar característica personalizada</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Digite uma característica..."
                            className="h-12"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                          />
                          <Button type="button" onClick={addFeature} className="h-12 px-6">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>

                      {formData.features.length > 0 && (
                        <div className="space-y-3">
                          <Label>Características selecionadas ({formData.features.length})</Label>
                          <div className="flex flex-wrap gap-2">
                            {formData.features.map((feature) => (
                              <Badge 
                                key={feature} 
                                variant="secondary" 
                                className="text-sm py-2 px-3 gap-2"
                              >
                                {feature}
                                <button
                                  type="button"
                                  onClick={() => removeFeature(feature)}
                                  className="hover:text-destructive transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Images */}
                {activeStep === 4 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Galeria de Fotos
                      </CardTitle>
                      <CardDescription>
                        Adicione fotos do imóvel. A primeira será a foto de capa.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Quality tips */}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> Imagens horizontais convertem mais</span>
                        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Fotos claras geram mais cliques</span>
                      </div>

                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files) {
                            handleImageUpload(e.dataTransfer.files);
                          }
                        }}
                      >
                        {isCompressing ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-lg font-medium mb-1">Comprimindo imagens...</p>
                            <p className="text-muted-foreground">Aguarde enquanto otimizamos suas fotos</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-lg font-medium mb-1">Arraste e solte suas imagens aqui</p>
                            <p className="text-muted-foreground mb-2">ou clique para selecionar arquivos</p>
                            <p className="text-xs text-muted-foreground">
                              {images.length} imagem(ns) • Compressão automática para arquivos &gt;5MB
                            </p>
                          </>
                        )}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={isCompressing}
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        />
                      </div>

                      {images.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Arraste as imagens para reordenar. A primeira será a capa.
                          </p>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={images.map((img, idx) => img.id || `new-${idx}`)}
                              strategy={rectSortingStrategy}
                            >
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((image, index) => (
                                  <SortableImage
                                    key={image.id || `new-${index}`}
                                    image={image}
                                    index={index}
                                    onRemove={removeImage}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step 5: SEO */}
                {activeStep === 5 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        SEO - Otimização para Google
                      </CardTitle>
                      <CardDescription>
                        Configure o título e descrição que aparecerão nos resultados de busca
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Generate SEO Button */}
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">Gerar SEO com base nos dados do imóvel</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Utiliza título, descrição, localização e tipo do imóvel para gerar SEO otimizado automaticamente.
                            </p>
                            <Button
                              type="button"
                              variant="admin"
                              onClick={handleGenerateSeo}
                              disabled={isGeneratingSeo || !formData.title || !formData.address_city}
                            >
                              {isGeneratingSeo ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
                              ) : (
                                <><Sparkles className="h-4 w-4 mr-2" />Gerar SEO Automático</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* SEO Title */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="seo_title">
                            Título SEO <span className="text-xs text-muted-foreground">(máx. 60 caracteres)</span>
                          </Label>
                          <span className={`text-xs ${formData.seo_title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formData.seo_title.length}/60
                          </span>
                        </div>
                        <Input
                          id="seo_title"
                          value={formData.seo_title}
                          onChange={(e) => setFormData({ ...formData, seo_title: e.target.value.substring(0, 70) })}
                          placeholder="Ex: Casa à Venda em Brasília DF | 3 Quartos, 200m²"
                          className="h-12"
                          maxLength={70}
                        />
                      </div>

                      {/* SEO Description */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="seo_description">
                            Meta Description <span className="text-xs text-muted-foreground">(máx. 155 caracteres)</span>
                          </Label>
                          <span className={`text-xs ${formData.seo_description.length > 155 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formData.seo_description.length}/155
                          </span>
                        </div>
                        <Textarea
                          id="seo_description"
                          value={formData.seo_description}
                          onChange={(e) => setFormData({ ...formData, seo_description: e.target.value.substring(0, 165) })}
                          placeholder="Ex: Casa à venda no Lago Sul, Brasília DF com 3 quartos, suíte master, churrasqueira e área gourmet. Agende sua visita!"
                          className="min-h-[100px] resize-none"
                          maxLength={165}
                        />
                      </div>

                      {/* Google Preview */}
                      {(formData.seo_title || formData.seo_description) && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Prévia no Google</Label>
                          <div className="p-4 bg-muted rounded-lg space-y-1">
                            <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                              {formData.seo_title || formData.title || 'Título do imóvel'}
                            </p>
                            <p className="text-xs text-green-700 truncate">
                              seusite.com.br/imoveis/{formData.slug || 'url-do-imovel'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {formData.seo_description || 'Descrição do imóvel aparecerá aqui...'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Dicas para SEO</h5>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          <li>• Inclua o tipo de imóvel e localização no título</li>
                          <li>• Use palavras-chave como "à venda", "para alugar", número de quartos</li>
                          <li>• A meta description deve ter um CTA (ex: "Agende visita")</li>
                          <li>• Evite textos genéricos ou duplicados</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation & Submit */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveStep(Math.max(0, activeStep - 1));
                    }}
                    disabled={activeStep === 0}
                  >
                    Anterior
                  </Button>

                  <div className="flex gap-3">
                    {/* Save as draft */}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={savingDraft || saving}
                    >
                      {savingDraft ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" />Salvar como rascunho</>
                      )}
                    </Button>
                    
                    {activeStep < steps.length - 1 ? (
                      <Button 
                        type="button"
                        variant="admin"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveStep(activeStep + 1);
                        }}
                      >
                        Próximo
                      </Button>
                    ) : (
                      <>
                        <Button 
                          type="submit" 
                          variant="admin" 
                          disabled={saving || savingDraft} 
                          className="min-w-[180px]"
                        >
                          {saving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                          ) : (
                            <><Send className="h-4 w-4 mr-2" />{isEditing ? 'Salvar e Publicar' : 'Cadastrar e Publicar'}</>
                          )}
                        </Button>
                        {!isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={saving || savingDraft}
                            onClick={async (e) => {
                              e.preventDefault();
                              setSaving(true);
                              try {
                                if (!formData.title || !formData.address_city || !formData.address_state) {
                                  toast.error('Preencha os campos obrigatórios: título, cidade e estado');
                                  return;
                                }
                                const propertyData = buildPropertyData();
                                const { data, error } = await supabase
                                  .from('properties')
                                  .insert(propertyData)
                                  .select('id')
                                  .single();
                                if (error) throw error;
                                await handleSaveImages(data.id);
                                toast.success('Imóvel cadastrado! Iniciando novo cadastro...');
                                // Reset form
                                setFormData({
                                  title: '', slug: '', description: '', price: '', condo_fee: '', condo_exempt: false,
                                  iptu: '', status: 'venda', type: 'casa', profile: 'residencial', condition: null,
                                  address_street: '', address_neighborhood: '', address_city: '', address_state: '',
                                  address_zipcode: '', location_type: 'approximate', bedrooms: '', suites: '',
                                  bathrooms: '', garages: '', area: '', built_area: '', financing: false,
                                  documentation: 'regular', featured: false, active: true, features: [], amenities: [],
                                  reference: '', category_id: '', seo_title: '', seo_description: '', integrar_portais: false,
                                });
                                setImages([]);
                                setActiveStep(0);
                                setHasUnsavedChanges(false);
                              } catch (error: any) {
                                console.error('Error:', error);
                                toast.error(error?.message || 'Erro ao salvar imóvel');
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Cadastrar e adicionar outro
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Unsaved changes dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
              <AlertDialogDescription>
                Existem alterações não salvas. Se você sair agora, perderá as modificações feitas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowUnsavedDialog(false);
                setPendingNavigation(null);
              }}>
                Continuar editando
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowUnsavedDialog(false);
                setHasUnsavedChanges(false);
                if (pendingNavigation) {
                  pendingNavigation();
                  setPendingNavigation(null);
                }
              }}>
                Sair sem salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </AdminLayout>
  );
};

export default PropertyFormPage;
