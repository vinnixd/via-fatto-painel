import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type PropertyStatus = Database['public']['Enums']['property_status'];
type PropertyType = Database['public']['Enums']['property_type'];
type PropertyProfile = Database['public']['Enums']['property_profile'];
type DocumentationStatus = Database['public']['Enums']['documentation_status'];

interface PropertyImage {
  id?: string;
  url: string;
  alt: string;
  order_index: number;
  file?: File;
  isNew?: boolean;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  price: number;
  status: PropertyStatus;
  type: PropertyType;
  profile: PropertyProfile;
  address_street: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zipcode: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garages: number;
  area: number;
  built_area: number;
  financing: boolean;
  documentation: DocumentationStatus;
  featured: boolean;
  features: string[];
  amenities: string[];
  reference: string;
  category_id: string;
}

const PropertyFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    { id: 'basic', title: 'Informações Básicas', icon: Home },
    { id: 'location', title: 'Localização', icon: MapPin },
    { id: 'specs', title: 'Especificações', icon: Maximize },
    { id: 'features', title: 'Características', icon: Sparkles },
    { id: 'images', title: 'Galeria', icon: ImageIcon },
  ];

  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    description: '',
    price: 0,
    status: 'venda',
    type: 'casa',
    profile: 'residencial',
    address_street: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zipcode: '',
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    garages: 0,
    area: 0,
    built_area: 0,
    financing: false,
    documentation: 'regular',
    featured: false,
    features: [],
    amenities: [],
    reference: '',
    category_id: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name');
      setCategories(data || []);
    };
    fetchCategories();
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
        price: property.price || 0,
        status: property.status,
        type: property.type,
        profile: property.profile,
        address_street: property.address_street || '',
        address_neighborhood: property.address_neighborhood || '',
        address_city: property.address_city || '',
        address_state: property.address_state || '',
        address_zipcode: property.address_zipcode || '',
        bedrooms: property.bedrooms || 0,
        suites: property.suites || 0,
        bathrooms: property.bathrooms || 0,
        garages: property.garages || 0,
        area: property.area || 0,
        built_area: property.built_area || 0,
        financing: property.financing || false,
        documentation: property.documentation,
        featured: property.featured || false,
        features: property.features || [],
        amenities: property.amenities || [],
        reference: property.reference || '',
        category_id: property.category_id || '',
      });

      // Fetch images
      const { data: propertyImages } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id)
        .order('order_index');

      setImages(propertyImages || []);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Erro ao carregar imóvel');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: generateSlug(value),
    });
  };

  const handleImageUpload = useCallback(async (files: FileList) => {
    const newImages: PropertyImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newImages.push({
        url,
        alt: file.name,
        order_index: images.length + i,
        file,
        isNew: true,
      });
    }

    setImages([...images, ...newImages]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.address_city || !formData.address_state) {
        toast.error('Preencha os campos obrigatórios');
        setSaving(false);
        return;
      }

      const propertyData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        price: Number(formData.price),
        status: formData.status,
        type: formData.type,
        profile: formData.profile,
        address_street: formData.address_street,
        address_neighborhood: formData.address_neighborhood,
        address_city: formData.address_city,
        address_state: formData.address_state,
        address_zipcode: formData.address_zipcode,
        bedrooms: Number(formData.bedrooms),
        suites: Number(formData.suites),
        bathrooms: Number(formData.bathrooms),
        garages: Number(formData.garages),
        area: Number(formData.area),
        built_area: formData.built_area ? Number(formData.built_area) : null,
        financing: formData.financing,
        documentation: formData.documentation,
        featured: formData.featured,
        features: formData.features,
        amenities: formData.amenities,
        reference: formData.reference,
        category_id: formData.category_id || null,
        created_by: user?.id,
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

      // Handle images
      const newImagesToUpload = images.filter(img => img.isNew && img.file);
      
      for (const img of newImagesToUpload) {
        if (!img.file) continue;

        const fileExt = img.file.name.split('.').pop();
        const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, img.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        await supabase.from('property_images').insert({
          property_id: propertyId,
          url: urlData.publicUrl,
          alt: img.alt,
          order_index: img.order_index,
        });
      }

      // Delete removed images
      if (isEditing) {
        const currentImageIds = images.filter(img => img.id).map(img => img.id);
        const { data: existingImages } = await supabase
          .from('property_images')
          .select('id, url')
          .eq('property_id', id);

        for (const existing of existingImages || []) {
          if (!currentImageIds.includes(existing.id)) {
            // Delete from storage
            const path = existing.url.split('/property-images/')[1];
            if (path) {
              await supabase.storage.from('property-images').remove([path]);
            }
            // Delete from database
            await supabase.from('property_images').delete().eq('id', existing.id);
          }
        }
      }

      toast.success(isEditing ? 'Imóvel atualizado com sucesso!' : 'Imóvel criado com sucesso!');
      navigate('/admin/imoveis');
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Erro ao salvar imóvel');
    } finally {
      setSaving(false);
    }
  };

  const commonFeatures = [
    'Piscina', 'Churrasqueira', 'Jardim', 'Varanda', 'Ar Condicionado',
    'Closet', 'Cozinha Americana', 'Despensa', 'Escritório', 'Academia',
    'Salão de Festas', 'Playground', 'Segurança 24h', 'Portaria', 'Elevador'
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title={isEditing ? 'Editar Imóvel' : 'Novo Imóvel'} 
        subtitle={isEditing ? 'Atualize as informações do imóvel' : 'Cadastre um novo imóvel no sistema'}
      />
      
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/admin/imoveis')} className="mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Steps */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = activeStep === index;
                    const isCompleted = activeStep > index;
                    
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStep(index)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : isCompleted
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive 
                            ? 'bg-primary-foreground/20' 
                            : isCompleted
                              ? 'bg-primary/20'
                              : 'bg-muted'
                        }`}>
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{step.title}</span>
                      </button>
                    );
                  })}
                </nav>

                <Separator className="my-4" />

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fotos</span>
                    <span className="font-medium">{images.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Características</span>
                    <span className="font-medium">{formData.features.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 0: Basic Info */}
              {activeStep === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Informações Básicas
                    </CardTitle>
                    <CardDescription>
                      Dados principais do imóvel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="title">Título do Anúncio *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="Ex: Casa espaçosa com 3 quartos no Centro"
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Amigável</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="casa-3-quartos-centro"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Gerado automaticamente a partir do título
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reference">Código de Referência</Label>
                        <Input
                          id="reference"
                          value={formData.reference}
                          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                          placeholder="REF-001"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Preço (R$) *
                        </Label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          placeholder="0"
                          className="h-12 text-lg font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status *</Label>
                        <Select value={formData.status} onValueChange={(v: PropertyStatus) => setFormData({ ...formData, status: v })}>
                          <SelectTrigger className="h-12">
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
                          <SelectTrigger className="h-12">
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Perfil</Label>
                        <Select value={formData.profile} onValueChange={(v: PropertyProfile) => setFormData({ ...formData, profile: v })}>
                          <SelectTrigger className="h-12">
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Descrição
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva o imóvel com detalhes..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Switch
                          checked={formData.featured}
                          onCheckedChange={(v) => setFormData({ ...formData, featured: v })}
                        />
                        <div>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Imóvel em Destaque
                          </Label>
                          <p className="text-xs text-muted-foreground">Aparece na página inicial</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Switch
                          checked={formData.financing}
                          onCheckedChange={(v) => setFormData({ ...formData, financing: v })}
                        />
                        <div>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Aceita Financiamento
                          </Label>
                          <p className="text-xs text-muted-foreground">Mostra selo de financiamento</p>
                        </div>
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
                        <Label htmlFor="address_zipcode">CEP</Label>
                        <Input
                          id="address_zipcode"
                          value={formData.address_zipcode}
                          onChange={(e) => setFormData({ ...formData, address_zipcode: e.target.value })}
                          placeholder="00000-000"
                          className="h-12"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
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
                          onChange={(e) => setFormData({ ...formData, suites: Number(e.target.value) })}
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
                          onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
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
                          onChange={(e) => setFormData({ ...formData, garages: Number(e.target.value) })}
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
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Maximize className="h-4 w-4 text-muted-foreground" />
                          Área Construída (m²)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.built_area || ''}
                          onChange={(e) => setFormData({ ...formData, built_area: Number(e.target.value) })}
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
                    <div>
                      <Label className="mb-3 block">Sugestões rápidas</Label>
                      <div className="flex flex-wrap gap-2">
                        {commonFeatures.map((feature) => {
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
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-medium mb-1">
                        Arraste e solte suas imagens aqui
                      </p>
                      <p className="text-muted-foreground">
                        ou clique para selecionar arquivos
                      </p>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      />
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                          <div 
                            key={index} 
                            className="relative group aspect-square rounded-xl overflow-hidden bg-muted ring-2 ring-transparent hover:ring-primary/50 transition-all"
                          >
                            <img
                              src={image.url}
                              alt={image.alt}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {index === 0 && (
                              <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md">
                                Capa
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation & Submit */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  Anterior
                </Button>

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => navigate('/admin/imoveis')}>
                    Cancelar
                  </Button>
                  
                  {activeStep < steps.length - 1 ? (
                    <Button type="button" onClick={() => setActiveStep(activeStep + 1)}>
                      Próximo
                    </Button>
                  ) : (
                    <Button type="submit" disabled={saving} className="min-w-[140px]">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {isEditing ? 'Salvar' : 'Cadastrar'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PropertyFormPage;
