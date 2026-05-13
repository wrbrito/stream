import { useEffect, useState } from 'react';
import { ArrowLeft, Upload, Link, Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { api, tratarErroApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface UploadVideoProps {
  onBack: () => void;
}

export function UploadVideo({ onBack }: UploadVideoProps) {
  const { usuario } = useAuth();
  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [categoriesList, setCategoriesList] = useState<{ id: number, nome: string }[]>([]);

    useEffect(() => {
    async function loadInitialData() {
      try {
        const catResponse = await api.categorias.listar();
        if (catResponse.sucesso && Array.isArray(catResponse.dados)) {
          setCategoriesList(catResponse.dados);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    }
    loadInitialData();
  }, []);

  // Buscar metadados do YouTube quando a URL mudar
  const handleYoutubeUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    // Se a URL é válida, tenta buscar os metadados
    if (url.trim().length > 20 && url.includes('youtube')) {
      setLoadingMetadata(true);
      try {
        const response = await api.videos.buscarMetadadosYoutube(url);
        if (response.sucesso && response.dados) {
          // Sempre atualiza o título e descrição do YouTube, permitindo edição posterior
          setTitle(response.dados.titulo);
          setDescription(response.dados.descricao);
          setMetadataLoaded(true);
        }
      } catch (error) {
        console.error('Erro ao buscar metadados:', error);
        // Não mostra erro, só continua sem os metadados
      } finally {
        setLoadingMetadata(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) {
      setUploadError('Título e categoria são obrigatórios');
      return;
    }

    if (uploadType === 'file' && !selectedFile) {
      setUploadError('Selecione um arquivo de vídeo ou áudio');
      return;
    }

    if (uploadType === 'youtube' && !youtubeUrl.trim()) {
      setUploadError('Digite o link do YouTube');
      return;
    }

    if (title.trim().length < 3) {
      setUploadError('Titulo deve ter pelo menos 3 caracteres');
      return;
    }

    if (description.trim().length < 10) {
      setUploadError('Descricao deve ter pelo menos 10 caracteres');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('titulo', title);
      formData.append('descricao', description);
      formData.append('categoriaId', category);
      formData.append('autor', usuario?.nome ?? 'Administrador da Escola');
      formData.append('tipo', uploadType === 'youtube' ? 'YOUTUBE' : 'INTERNO');
      formData.append('tags', tags);
      
      if (uploadType === 'file') {
        formData.append('arquivo', selectedFile!);
        if (thumbnailFile) formData.append('miniatura', thumbnailFile);
      } else {
        formData.append('urlOriginal', youtubeUrl);
      }

      await api.videos.criar(formData);
      setUploadSuccess(true);
      setTimeout(() => onBack(), 2000);
    } catch (error) {
      setUploadError('Erro ao enviar. Tente novamente.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-xl border border-border shadow-lg p-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Enviar Novo Conteúdo
            </h1>
            <p className="text-muted-foreground mb-6">
              Compartilhe vídeos ou áudios com a comunidade escolar
            </p>

            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setUploadType('file')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 transition-all ${
                  uploadType === 'file'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload de Arquivo</span>
              </button>
              <button
                onClick={() => setUploadType('youtube')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 transition-all ${
                  uploadType === 'youtube'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Link className="w-5 h-5" />
                <span className="font-medium">Link do YouTube</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {uploadType === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Arquivo de Vídeo ou Áudio
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="video-file"
                    />
                    <label
                      htmlFor="video-file"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                      {selectedFile ? (
                        <p className="text-foreground font-medium">
                          {selectedFile.name}
                        </p>
                      ) : (
                        <>
                          <p className="text-foreground font-medium mb-1">
                            Clique para selecionar ou arraste o arquivo
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vídeos (MP4, MOV) ou Áudio (MP3)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Input
                      label="Link do YouTube"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      required
                    />
                    {loadingMetadata && (
                      <div className="absolute right-3 top-10 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Buscando...</span>
                      </div>
                    )}
                    {metadataLoaded && !loadingMetadata && (
                      <div className="absolute right-3 top-10 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Preenchido</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">
                      Vídeos do YouTube podem ser exibidos externamente ou
                      importados para o servidor pelo administrador
                    </p>
                  </div>
                </div>
              )}

              <Input
                label="Título"
                placeholder="Ex: Introdução à Matemática Aplicada - Aula 01"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  placeholder="Descreva o conteúdo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Tags (separadas por vírgula)"
                placeholder="matemática, aula, 2º ano"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Miniatura (opcional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setThumbnailFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                    id="thumbnail"
                  />
                  <label
                    htmlFor="thumbnail"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {thumbnailFile ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <img 
                          src={URL.createObjectURL(thumbnailFile)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium">Trocar imagem</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para adicionar uma miniatura personalizada
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {uploadSuccess ? (
                <div className="flex flex-col items-center gap-4 pt-4">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Conteúdo enviado com sucesso!</h3>
                  <p className="text-muted-foreground">Redirecionando em 2 segundos...</p>
                </div>
              ) : (
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" size="lg" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Conteúdo'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    size="lg"
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {uploadError && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{uploadError}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
