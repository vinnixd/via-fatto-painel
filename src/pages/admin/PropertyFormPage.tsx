import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Upload, X, Plus } from 'lucide-react';
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
        subtitle={isEditing ? formData.title : 'Cadastre um novo imóvel'}
      />
      
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/admin/imoveis')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-card border">
              <TabsTrigger value="general">Informações Gerais</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="images">Galeria</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Ex: Casa de 3 quartos no Centro"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="casa-3-quartos-centro"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o imóvel..."
                      rows={5}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(v: PropertyStatus) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="aluguel">Aluguel</SelectItem>
                          <SelectItem value="vendido">Vendido</SelectItem>
                          <SelectItem value="alugado">Alugado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Select value={formData.type} onValueChange={(v: PropertyType) => setFormData({ ...formData, type: v })}>
                        <SelectTrigger>
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
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference">Referência</Label>
                      <Input
                        id="reference"
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        placeholder="REF-001"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.featured}
                        onCheckedChange={(v) => setFormData({ ...formData, featured: v })}
                      />
                      <Label>Imóvel em Destaque</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.financing}
                        onCheckedChange={(v) => setFormData({ ...formData, financing: v })}
                      />
                      <Label>Aceita Financiamento</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address_street">Rua</Label>
                      <Input
                        id="address_street"
                        value={formData.address_street}
                        onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_neighborhood">Bairro</Label>
                      <Input
                        id="address_neighborhood"
                        value={formData.address_neighborhood}
                        onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address_city">Cidade *</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_state">Estado *</Label>
                      <Input
                        id="address_state"
                        value={formData.address_state}
                        onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_zipcode">CEP</Label>
                      <Input
                        id="address_zipcode"
                        value={formData.address_zipcode}
                        onChange={(e) => setFormData({ ...formData, address_zipcode: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Especificações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Quartos</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="0"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suites">Suítes</Label>
                      <Input
                        id="suites"
                        type="number"
                        min="0"
                        value={formData.suites}
                        onChange={(e) => setFormData({ ...formData, suites: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Banheiros</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min="0"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="garages">Vagas</Label>
                      <Input
                        id="garages"
                        type="number"
                        min="0"
                        value={formData.garages}
                        onChange={(e) => setFormData({ ...formData, garages: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">Área Total (m²)</Label>
                      <Input
                        id="area"
                        type="number"
                        min="0"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="built_area">Área Construída (m²)</Label>
                      <Input
                        id="built_area"
                        type="number"
                        min="0"
                        value={formData.built_area || ''}
                        onChange={(e) => setFormData({ ...formData, built_area: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile">Perfil</Label>
                      <Select value={formData.profile} onValueChange={(v: PropertyProfile) => setFormData({ ...formData, profile: v })}>
                        <SelectTrigger>
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
                      <Label htmlFor="documentation">Documentação</Label>
                      <Select value={formData.documentation} onValueChange={(v: DocumentationStatus) => setFormData({ ...formData, documentation: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="irregular">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Características do Imóvel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Ex: Piscina, Churrasqueira, etc."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-sm py-1.5">
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {formData.features.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma característica adicionada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Galeria de Fotos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
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
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Arraste e solte imagens aqui ou clique para selecionar
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

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-100">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Capa
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/imoveis')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Cadastrar Imóvel'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default PropertyFormPage;
