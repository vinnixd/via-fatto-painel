import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Phone, Mail, MapPin, MessageCircle, Clock, User, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteConfig } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

const ContactPage = () => {
  const { data: siteConfig } = useSiteConfig();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Save to database
      const { error } = await supabase.from('contacts').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: `Assunto: ${formData.subject}\n\n${formData.message}`,
      });

      if (error) throw error;

      // Create WhatsApp message
      const whatsappPhone = siteConfig?.whatsapp?.replace(/\D/g, '') || '5511999887766';
      const whatsappMessage = `Olá!\n\nNome: ${formData.name}\nE-mail: ${formData.email}\nTelefone: ${formData.phone}\nAssunto: ${formData.subject}\n\nMensagem:\n${formData.message}`;
      
      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success('Mensagem enviada com sucesso!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Entre em Contato
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Estamos aqui para ajudar você a encontrar o imóvel perfeito 
                ou esclarecer qualquer dúvida. Vamos conversar!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="card-property p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Send className="mr-2 text-primary" size={24} />
                  Envie sua Mensagem
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field w-full"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field w-full"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Assunto *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="input-field w-full"
                    >
                      <option value="">Selecione um assunto</option>
                      <option value="Comprar Imóvel">Comprar Imóvel</option>
                      <option value="Vender Imóvel">Vender Imóvel</option>
                      <option value="Alugar Imóvel">Alugar Imóvel</option>
                      <option value="Avaliação de Imóvel">Avaliação de Imóvel</option>
                      <option value="Financiamento">Financiamento</option>
                      <option value="Consultoria">Consultoria</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="input-field w-full resize-none"
                      placeholder="Conte-me mais sobre o que você procura..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle size={18} />
                        <span>Enviar via WhatsApp</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                {/* Direct Contact */}
                <div className="card-property p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <User className="mr-2 text-primary" size={24} />
                    Via Fatto Imóveis
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="text-primary flex-shrink-0" size={20} />
                      <div>
                        <a 
                          href={`tel:${siteConfig?.phone || '+5511999887766'}`}
                          className="text-foreground hover:text-primary transition-colors font-medium"
                        >
                          {siteConfig?.phone || '(11) 99988-7766'}
                        </a>
                        <p className="text-sm text-muted-foreground">Ligação direta</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MessageCircle className="text-primary flex-shrink-0" size={20} />
                      <div>
                        <a 
                          href={`https://wa.me/${siteConfig?.whatsapp?.replace(/\D/g, '') || '5511999887766'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-primary transition-colors font-medium"
                        >
                          WhatsApp
                        </a>
                        <p className="text-sm text-muted-foreground">Resposta rápida</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="text-primary flex-shrink-0" size={20} />
                      <div>
                        <a 
                          href={`mailto:${siteConfig?.email || 'contato@viafatto.com.br'}`}
                          className="text-foreground hover:text-primary transition-colors font-medium"
                        >
                          {siteConfig?.email || 'contato@viafatto.com.br'}
                        </a>
                        <p className="text-sm text-muted-foreground">E-mail profissional</p>
                      </div>
                    </div>

                    {siteConfig?.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="text-primary flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="text-foreground font-medium whitespace-pre-line">
                            {siteConfig.address}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Escritório</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      <strong>CRECI-SP 123456</strong><br />
                      Corretora de Imóveis Licenciada
                    </p>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="card-property p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Clock className="mr-2 text-primary" size={20} />
                    Horário de Atendimento
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segunda - Sexta</span>
                      <span className="font-medium">08:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sábado</span>
                      <span className="font-medium">09:00 - 15:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Domingo</span>
                      <span className="font-medium">Emergências</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-center">
                      <strong>WhatsApp disponível 24h</strong><br />
                      <span className="text-muted-foreground">Para urgências e agendamentos</span>
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4">
                  <a
                    href={`https://wa.me/${siteConfig?.whatsapp?.replace(/\D/g, '') || '5511999887766'}?text=Olá! Gostaria de agendar uma visita.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-center"
                  >
                    Agendar Visita
                  </a>
                  <a
                    href={`https://wa.me/${siteConfig?.whatsapp?.replace(/\D/g, '') || '5511999887766'}?text=Olá! Gostaria de uma avaliação do meu imóvel.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-center"
                  >
                    Avaliar Meu Imóvel
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
