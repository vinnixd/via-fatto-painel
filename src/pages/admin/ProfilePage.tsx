import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Shield, Camera, Lock, Check } from 'lucide-react';
import bannerProfile from '@/assets/banner-profile.png';
import { compressImage } from '@/lib/imageCompression';

// Preload banner image
const preloadBanner = () => {
  const img = new Image();
  img.src = bannerProfile;
};
preloadBanner();

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  creci: string | null;
  avatar_url: string | null;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  });

  // Preload banner on mount
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBannerLoaded(true);
    img.src = bannerProfile;
    if (img.complete) setBannerLoaded(true);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            email: user?.email || '',
            name: '',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploadingAvatar(true);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.9 });
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `avatars/${profile.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      const newAvatarUrl = urlData.publicUrl;
      
      // Update in database immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: newAvatarUrl });
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          phone: profile.phone,
          creci: profile.creci,
          avatar_url: profile.avatar_url,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      toast.error('As senhas não conferem');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setPasswords({ new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'AD';
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

  if (!profile) return null;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div 
              className={`h-24 bg-cover bg-center transition-opacity duration-300 ${bannerLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ 
                backgroundImage: `url(${bannerProfile})`,
                backgroundColor: 'hsl(var(--muted))'
              }} 
            />
            {!bannerLoaded && (
              <div className="h-24 bg-gradient-to-r from-muted to-muted/70 animate-pulse absolute inset-x-0 top-0" />
            )}
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                {/* Avatar with upload */}
                <div className="relative group">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                    <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials(profile.name, profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Name and email */}
                <div className="flex-1 min-w-0 pb-1">
                  <h2 className="text-2xl font-bold text-foreground truncate">
                    {profile.name || 'Seu Nome'}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </p>
                </div>

                {/* Save button */}
                <Button variant="admin" onClick={handleSaveProfile} disabled={saving} className="shrink-0">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Personal Info Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais e informações de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      className="pl-10 h-11"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      className="pl-10 h-11 bg-muted/50"
                      value={profile.email}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone / WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10 h-11"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creci" className="text-sm font-medium">
                    CRECI
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="creci"
                      className="pl-10 h-11"
                      value={profile.creci || ''}
                      onChange={(e) => setProfile({ ...profile, creci: e.target.value })}
                      placeholder="CRECI-DF: 00000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Segurança
                </CardTitle>
                <CardDescription>
                  Altere sua senha para manter sua conta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">
                      Nova Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        className="pl-10 h-11"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        className="pl-10 h-11"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A senha deve ter pelo menos 6 caracteres
                    </p>
                  </div>

                  <Button type="submit" variant="admin" disabled={saving || !passwords.new} className="w-full h-11">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Alterar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProfilePage;
