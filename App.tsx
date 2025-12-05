
import React, { useState, useEffect } from 'react';
import SceneCard from './components/SceneCard';
import Spinner from './components/Spinner';
import { SCENE_STRUCTURES } from './constants';
import { Scene, GenerationStatus, SceneStructure } from './types';
import * as geminiService from './services/geminiService';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import Switch from './components/Switch';
import UgcToolIcon from './components/icons/UgcToolIcon';
import PersonalBrandingIcon from './components/icons/PersonalBrandingIcon';
import ImageUploader from './components/ImageUploader';

const App: React.FC = () => {
  // Shared State
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth > 768);
  const [activeTool, setActiveTool] = useState('ugc-tool');

  // UGC Tool State
  const [productImage, setProductImage] = useState<File | null>(null);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [productName, setProductName] = useState('');
  const [additionalBrief, setAdditionalBrief] = useState('');
  const [sceneStructureId, setSceneStructureId] = useState(SCENE_STRUCTURES[0].id);
  const [ugcSceneCount, setUgcSceneCount] = useState(4);
  const [generateVoiceOver, setGenerateVoiceOver] = useState(true);
  const [addBackgroundMusic, setAddBackgroundMusic] = useState(false);
  const [ctaPerScene, setCtaPerScene] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [ugcHasGenerated, setUgcHasGenerated] = useState(false);

  // Personal Branding Tool State
  const [pbComments, setPbComments] = useState('');
  const [pbReferenceScript, setPbReferenceScript] = useState('');
  const [pbAdditionalBrief, setPbAdditionalBrief] = useState('');
  const [pbSceneCount, setPbSceneCount] = useState(4);
  const [pbScenes, setPbScenes] = useState<Scene[]>([]);
  const [isPbLoading, setIsPbLoading] = useState(false);
  const [pbGenerateVo, setPbGenerateVo] = useState(true);
  const [pbAddMusic, setPbAddMusic] = useState(false);
  const [pbLoadingMessage, setPbLoadingMessage] = useState('');
  const [pbHasGenerated, setPbHasGenerated] = useState(false);
  

  // Initialize or adjust scenes for UGC Tool based on count
  useEffect(() => {
    if (activeTool === 'ugc-tool') {
        if (scenes.length !== ugcSceneCount) {
             const initialScenes = Array.from({ length: ugcSceneCount }, (_, i) => ({
                id: i + 1,
                title: `Adegan ${i + 1}`,
                description: 'Menunggu pembuatan konten...',
                image: '',
                script: '',
                overlayTextSuggestion: '',
                status: GenerationStatus.PENDING,
                imagePrompt: '',
                videoPrompt: '',
            }));
            setScenes(initialScenes);
        }
    }
  }, [activeTool, ugcSceneCount, scenes.length]);
  
  // Initialize or adjust scenes for Personal Branding Tool based on count
  useEffect(() => {
    if (activeTool === 'personal-branding') {
        if (pbScenes.length !== pbSceneCount) {
            const initialScenes = Array.from({ length: pbSceneCount }, (_, i) => ({
                id: i + 1,
                title: `Adegan ${i + 1}`,
                description: 'Konten personal branding',
                image: '',
                script: '',
                overlayTextSuggestion: '',
                status: GenerationStatus.PENDING,
                imagePrompt: '',
                videoPrompt: `Animasi halus seolah model sedang berbicara dengan natural.`,
                errorMessage: ''
            }));
            setPbScenes(initialScenes);
        }
    }
  }, [activeTool, pbSceneCount, pbScenes.length]);


  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true); // Assume success after open
      setError(null);
    }
  };
  
  // --- UGC Tool Handlers ---
  const ugcHandleVideoPromptChange = (sceneId: number, prompt: string) => setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoPrompt: prompt } : s));
  const ugcHandleScriptChange = (sceneId: number, script: string) => setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, script: script } : s));
  const ugcResetState = () => {
    const initialScenes = Array.from({ length: ugcSceneCount }, (_, i) => ({ id: i + 1, title: `Adegan ${i + 1}`, description: 'Menunggu pembuatan konten...', image: '', script: '', overlayTextSuggestion: '', status: GenerationStatus.PENDING, imagePrompt: '', videoPrompt: '' }));
    setScenes(initialScenes);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
    setUgcHasGenerated(false);
  };
  const handleGenerateInitialAssets = async () => {
    setError(null);
    const selectedStructure = SCENE_STRUCTURES.find(s => s.id === sceneStructureId)!;
    const modelIsRequired = selectedStructure.requiredParts.includes('model');
    const productIsRequired = selectedStructure.requiredParts.includes('product');

    if (modelIsRequired && !modelImage) { setError(`Struktur adegan "${selectedStructure.name}" membutuhkan gambar model. Mohon unggah.`); return; }
    if (productIsRequired && !productImage) { setError('Mohon unggah gambar produk.'); return; }
    if (!productName) { setError('Mohon isi Nama Produk atau Topik Video.'); return; }
    
    // Reset scenes but show the panel
    const initialScenes = Array.from({ length: ugcSceneCount }, (_, i) => ({ id: i + 1, title: `Adegan ${i + 1}`, description: 'Menunggu pembuatan konten...', image: '', script: '', overlayTextSuggestion: '', status: GenerationStatus.PENDING, imagePrompt: '', videoPrompt: '' }));
    setScenes(initialScenes);
    setUgcHasGenerated(true);
    setIsLoading(true);

    try {
      setLoadingMessage('Menyiapkan aset...');
      
      let imageParts: any = { };
      if (productImage) {
        imageParts.product = await geminiService.fileToGenerativePart(productImage);
      } 
      
      // Workaround for optional product if not strictly required by logic but type requires it (fallback to model image as product slot)
      if (!productImage && modelImage && !productIsRequired) {
          imageParts.product = await geminiService.fileToGenerativePart(modelImage);
      }

      const modelPart = modelImage ? await geminiService.fileToGenerativePart(modelImage) : undefined;
      
      if (modelImage) {
          imageParts.model = modelPart;
      }

      setLoadingMessage('Membuat rencana konten & naskah...');
      const planningPrompt = selectedStructure.planningPrompt(productName, additionalBrief, ugcSceneCount, ctaPerScene);
      const plan = await geminiService.generateUgcPlan(planningPrompt, ugcSceneCount);
      
      const imagePrompts = plan.map(p => p.image_prompt);
      
      setLoadingMessage('Membuat gambar...');
      const images = await geminiService.generateUgcImages(imagePrompts, imageParts);
      
      const updatedScenes = scenes.map((scene, index) => ({ 
        ...scene, 
        image: images[index], 
        title: plan[index].title,
        description: plan[index].description,
        script: plan[index].script, 
        overlayTextSuggestion: plan[index].overlay_text,
        caption: plan[index].caption, 
        imagePrompt: plan[index].image_prompt,
        videoPrompt: plan[index].video_prompt,
        status: GenerationStatus.IMAGE_READY,
      }));
      setScenes(updatedScenes);
    } catch (e: any) { console.error('Initial generation failed:', e); setError(e.message || 'Terjadi kesalahan tak terduga.'); setScenes(prev => prev.map(s => ({...s, status: GenerationStatus.ERROR, errorMessage: e.message}))); } finally { setIsLoading(false); setLoadingMessage(''); }
  };

  const handleRegenerateImage = async (sceneId: number) => {
    const selectedStructure = SCENE_STRUCTURES.find(s => s.id === sceneStructureId)!;
    const modelIsRequired = selectedStructure.requiredParts.includes('model');
    const productIsRequired = selectedStructure.requiredParts.includes('product');
    const scene = scenes.find(s => s.id === sceneId);

    if (!scene || !scene.imagePrompt) { setError("Prompt gambar tidak ditemukan."); return; }
    if (modelIsRequired && !modelImage) { setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.ERROR, errorMessage: 'Gambar model diperlukan untuk adegan ini.' } : s)); return; }
    if (productIsRequired && !productImage) { setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.ERROR, errorMessage: 'Gambar produk diperlukan.' } : s)); return; }

    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.GENERATING_IMAGE, errorMessage: '' } : s));
    try { 
      let imageParts: any = {};
      if (productImage) {
          imageParts.product = await geminiService.fileToGenerativePart(productImage);
      } else if (modelImage) {
          imageParts.product = await geminiService.fileToGenerativePart(modelImage);
      }
      
      const modelPart = modelImage ? await geminiService.fileToGenerativePart(modelImage) : undefined; 
      if (modelPart) imageParts.model = modelPart;

      const newImage = await geminiService.regenerateSingleImage(scene.imagePrompt, imageParts); 
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, image: newImage, status: GenerationStatus.IMAGE_READY } : s)); 
    } catch (e: any) { 
        console.error(`Error regenerating image for scene ${sceneId}:`, e); 
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.ERROR, errorMessage: e.message } : s)); 
    }
  };
  const handleGenerateVideo = async (sceneId: number, customPrompt: string) => {
      const scene = scenes.find(s => s.id === sceneId); if (!scene || !scene.image) return;
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.GENERATING_VIDEO, errorMessage: '' } : s));
      try { const videoUrl = await geminiService.generateVideoFromImage(scene.image, customPrompt, scene.script, addBackgroundMusic); setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, videoUrl, status: GenerationStatus.COMPLETED } : s)); } catch (videoError: any) { console.error(`Error generating video for scene ${scene.id}:`, videoError); const errorMessage = videoError.message || 'Unknown error'; let displayError = 'Gagal membuat video.'; if (errorMessage.includes("Requested entity was not found.")) { setError("API Key tidak ditemukan. Mohon pilih ulang API key Anda."); setApiKeySelected(false); displayError = "API Key tidak ditemukan."; } else if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) { displayError = "Batas kuota untuk key ini habis."; setError("Kuota API Key habis. Mohon pilih API key yang lain untuk melanjutkan."); setApiKeySelected(false); } setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: GenerationStatus.ERROR, errorMessage: displayError } : s)); }
  };
  const isAnySceneProcessing = scenes.some(s => s.status === GenerationStatus.GENERATING_IMAGE || s.status === GenerationStatus.GENERATING_VIDEO);

  // --- Personal Branding Tool Handlers ---
  const pbHandleVideoPromptChange = (sceneId: number, prompt: string) => setPbScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoPrompt: prompt } : s));
  const pbHandleScriptChange = (sceneId: number, script: string) => setPbScenes(prev => prev.map(s => s.id === sceneId ? { ...s, script: script } : s));
  const pbResetState = () => {
    const initialScenes = Array.from({ length: pbSceneCount }, (_, i) => ({ id: i + 1, title: `Adegan ${i + 1}`, description: 'Konten personal branding', image: '', script: '', overlayTextSuggestion: '', status: GenerationStatus.PENDING, imagePrompt: '', videoPrompt: `Animasi halus seolah model sedang berbicara dengan natural.`, errorMessage: '' }));
    setPbScenes(initialScenes);
    setError(null);
    setIsPbLoading(false);
    setPbLoadingMessage('');
    setPbHasGenerated(false);
  };
  const handleGeneratePbContent = async () => {
      if (!pbComments || !pbReferenceScript) { setError("Mohon isi kolom komentar dan naskah referensi."); return; }
      const initialScenes = Array.from({ length: pbSceneCount }, (_, i) => ({ id: i + 1, title: `Adegan ${i + 1}`, description: 'Konten personal branding', image: '', script: '', overlayTextSuggestion: '', status: GenerationStatus.PENDING, imagePrompt: '', videoPrompt: `Animasi halus seolah model sedang berbicara dengan natural.`, errorMessage: '' }));
      setPbScenes(initialScenes);
      setPbHasGenerated(true);
      setIsPbLoading(true);
      try {
          setPbLoadingMessage('Menganalisis input & membuat naskah...');
          const { scenes: scenesData, images } = await geminiService.generatePersonalBrandingContent(pbComments, pbReferenceScript, pbAdditionalBrief, pbSceneCount);
          
          const updatedScenes = pbScenes.map((scene, i) => ({
              ...scene,
              script: scenesData[i].script,
              overlayTextSuggestion: scenesData[i].overlay,
              imagePrompt: scenesData[i].imagePrompt, 
              videoPrompt: `Animasi halus seolah model sedang berbicara dengan natural, sesuai naskah.`,
              image: images[i],
              status: GenerationStatus.IMAGE_READY,
          }));
          setPbScenes(updatedScenes);
      } catch (e: any) { console.error('PB generation failed:', e); setError(e.message || 'Gagal membuat konten personal branding.'); setPbScenes(prev => prev.map(s => ({...s, status: GenerationStatus.ERROR, errorMessage: e.message}))); } finally { setIsPbLoading(false); setPbLoadingMessage(''); }
  };
   const handleRegeneratePbImage = async (sceneId: number) => {
    const scene = pbScenes.find(s => s.id === sceneId);
    if (!scene || !scene.imagePrompt) {
        setError("Prompt gambar tidak ditemukan untuk adegan ini.");
        return;
    }
    setPbScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.GENERATING_IMAGE, errorMessage: '' } : s));
    try {
        const newImage = await geminiService.generateImageFromPrompt(scene.imagePrompt);
        setPbScenes(prev => prev.map(s => s.id === sceneId ? { ...s, image: newImage, status: GenerationStatus.IMAGE_READY } : s));
    } catch (e: any) { console.error(`Error regenerating PB image for scene ${sceneId}:`, e); setPbScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.ERROR, errorMessage: e.message } : s)); }
  };
  const handleGeneratePbVideo = async (sceneId: number, customPrompt: string) => {
    const scene = pbScenes.find(s => s.id === sceneId); if (!scene || !scene.image) return;
    setPbScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: GenerationStatus.GENERATING_VIDEO, errorMessage: '' } : s));
    try { const videoUrl = await geminiService.generateVideoFromImage(scene.image, customPrompt, scene.script, pbAddMusic); setPbScenes(prev => prev.map(s => s.id === scene.id ? { ...s, videoUrl, status: GenerationStatus.COMPLETED } : s)); } catch (videoError: any) { console.error(`Error generating video for scene ${scene.id}:`, videoError); const errorMessage = videoError.message || 'Unknown error'; let displayError = 'Gagal membuat video.'; if (errorMessage.includes("Requested entity was not found.")) { setError("API Key tidak ditemukan. Mohon pilih ulang API key Anda."); setApiKeySelected(false); displayError = "API Key tidak ditemukan."; } else if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) { displayError = "Batas kuota untuk key ini habis."; setError("Kuota API Key habis. Mohon pilih API key yang lain untuk melanjutkan."); setApiKeySelected(false); } setPbScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: GenerationStatus.ERROR, errorMessage: displayError } : s)); }
  };
  const isAnyPbSceneProcessing = pbScenes.some(s => s.status === GenerationStatus.GENERATING_IMAGE || s.status === GenerationStatus.GENERATING_VIDEO);
  

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-800">
        <Sidebar isExpanded={isSidebarExpanded} onToggle={() => setIsSidebarExpanded(prev => !prev)} activeTool={activeTool} onToolChange={(toolId) => { setError(null); ugcResetState(); pbResetState(); setActiveTool(toolId); }} />
        
        {(isLoading || isPbLoading) && (
          <div className="fixed inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-50 text-gray-900">
            <Spinner />
            <p className="mt-4 text-lg font-semibold">{loadingMessage || pbLoadingMessage || 'Membuat...'}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col pt-16 md:pt-0">
          {/* --- Main Content --- */}
          {activeTool === 'ugc-tool' && (
            <div className="flex-1 flex flex-col md:flex-row">
              <SettingsPanel 
                  className="md:order-2"
                  productImage={productImage} 
                  modelImage={modelImage} 
                  productName={productName} 
                  additionalBrief={additionalBrief} 
                  sceneStructureId={sceneStructureId} 
                  ugcSceneCount={ugcSceneCount}
                  generateVoiceOver={generateVoiceOver} 
                  addBackgroundMusic={addBackgroundMusic} 
                  ctaPerScene={ctaPerScene}
                  onProductImageUpload={setProductImage} 
                  onModelImageUpload={setModelImage} 
                  onProductNameChange={setProductName} 
                  onAdditionalBriefChange={setAdditionalBrief} 
                  onSceneStructureChange={setSceneStructureId} 
                  onUgcSceneCountChange={setUgcSceneCount}
                  onGenerateVoiceOverChange={setGenerateVoiceOver} 
                  onAddBackgroundMusicChange={setAddBackgroundMusic} 
                  onCtaPerSceneChange={setCtaPerScene}
                  onGenerate={handleGenerateInitialAssets} 
                  apiKeySelected={apiKeySelected} 
                  onSelectKey={handleSelectKey} 
                  isLoading={isLoading || isAnySceneProcessing} 
                  error={error} 
              />
              {ugcHasGenerated ? (
                <main className="flex-1 flex flex-col md:order-1 md:overflow-y-auto">
                    <header className="px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Generator UGC</h1>
                            <p className="text-sm text-gray-500">Buat konten UGC dengan AI dari gambar produk Anda</p>
                        </div>
                    </header>
                    <div className="flex-1 p-4 md:p-8 space-y-6">
                        <h2 className="text-lg font-semibold">Generasi Saat Ini <span className="text-sm text-gray-500 font-normal">({scenes.filter(s => s.image).length}/{ugcSceneCount} adegan selesai)</span></h2>
                        <div className="grid grid-cols-1 gap-6">{scenes.map(scene => (<SceneCard key={scene.id} scene={scene} onRegenerateImage={handleRegenerateImage} onGenerateVideo={handleGenerateVideo} onVideoPromptChange={ugcHandleVideoPromptChange} onScriptChange={ugcHandleScriptChange} isVoiceOverEnabled={generateVoiceOver} addBackgroundMusic={addBackgroundMusic} />))}</div>
                    </div>
                </main>
              ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-gray-50 md:order-1">
                    <div className="max-w-md">
                        <UgcToolIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <h2 className="mt-4 text-xl font-bold text-gray-800">Selamat Datang di Generator UGC</h2>
                        <p className="mt-2 text-gray-500">
                            Isi pengaturan di panel sebelah kanan untuk memulai. Unggah gambar, berikan nama produk, dan biarkan AI membuatkan konten video untuk Anda.
                        </p>
                    </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'personal-branding' && (
             <div className="flex-1 flex flex-col md:flex-row">
              <aside className="w-full md:w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col md:order-2">
                  <header className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Input & Pengaturan</h2><p className="text-xs text-gray-500">Konfigurasi konten personal branding</p></header>
                  <div className="flex-1 p-4 space-y-4 md:overflow-y-auto">
                      <div><label htmlFor="pb-comments" className="text-sm font-semibold text-gray-600 mb-2 block">Komentar Terdahulu</label><textarea id="pb-comments" rows={5} value={pbComments} onChange={(e) => setPbComments(e.target.value)} placeholder="Salin & tempel komentar relevan dari audiens Anda di sini..." className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500" disabled={isPbLoading} /></div>
                      <div><label htmlFor="pb-ref-script" className="text-sm font-semibold text-gray-600 mb-2 block">Naskah Referensi</label><textarea id="pb-ref-script" rows={5} value={pbReferenceScript} onChange={(e) => setPbReferenceScript(e.target.value)} placeholder="Tempelkan naskah dari konten yang ingin Anda tiru gaya dan hook-nya..." className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500" disabled={isPbLoading} /></div>
                      <div><label htmlFor="pb-brief" className="text-sm font-semibold text-gray-600 mb-2 block">Brief Tambahan (Opsional)</label><textarea id="pb-brief" rows={3} value={pbAdditionalBrief} onChange={(e) => setPbAdditionalBrief(e.target.value)} placeholder="Instruksi spesifik untuk AI..." className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500" disabled={isPbLoading} /></div>
                      <div>
                          <label htmlFor="pb-scene-count" className="text-sm font-semibold text-gray-600 mb-2 block">Jumlah Adegan</label>
                          <select
                              id="pb-scene-count"
                              value={pbSceneCount}
                              onChange={(e) => setPbSceneCount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500"
                              disabled={isPbLoading}
                          >
                              <option value="4">4 Adegan (Cepat)</option>
                              <option value="6">6 Adegan (Standar)</option>
                              <option value="8">8 Adegan (Detail)</option>
                              <option value="10">10 Adegan (Lengkap)</option>
                          </select>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-gray-200"><Switch label="Buat Voice Over" enabled={pbGenerateVo} onChange={setPbGenerateVo} disabled={isPbLoading} /><Switch label="Tambah Musik Latar" enabled={pbAddMusic} onChange={setPbAddMusic} disabled={isPbLoading} /></div>
                  </div>
                  <footer className="p-4 border-t border-gray-200 bg-white">
                      <div className="text-xs text-gray-500 mb-4 text-center">Catatan: Pembuatan video memakan banyak sumber daya. Mohon pantau <a href="https://ai.dev/usage?tab=rate-limit" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">dasbor kuota</a> Anda.</div>
                      {!apiKeySelected ? ( <div className="flex flex-col items-center text-center"><p className="mb-2 text-sm text-red-500 font-medium">Pembuatan video memerlukan Kunci API.</p><p className="mb-3 text-xs text-gray-500">Lihat <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">dokumen penagihan</a>.</p><button onClick={handleSelectKey} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700">Pilih Kunci API</button></div> ) : ( <button onClick={handleGeneratePbContent} disabled={isPbLoading || !pbComments || !pbReferenceScript || isAnyPbSceneProcessing} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"><span className="text-xl">👤✨</span>{isPbLoading ? 'Membuat...' : 'Buat Konten'}</button> )}
                      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                  </footer>
              </aside>
              {pbHasGenerated ? (
                <main className="flex-1 flex flex-col md:order-1 md:overflow-y-auto">
                    <header className="px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Konten Personal Branding</h1>
                            <p className="text-sm text-gray-500">Buat konten dari umpan balik audiens dan inspirasi Anda</p>
                        </div>
                    </header>
                    <div className="flex-1 p-4 md:p-8 space-y-6">
                        <h2 className="text-lg font-semibold">Rancangan Konten <span className="text-sm text-gray-500 font-normal">({pbScenes.filter(s => s.image).length}/{pbSceneCount} adegan siap)</span></h2>
                        <div className="grid grid-cols-1 gap-6">{pbScenes.map(scene => (<SceneCard key={scene.id} scene={scene} onRegenerateImage={handleRegeneratePbImage} onGenerateVideo={handleGeneratePbVideo} onVideoPromptChange={pbHandleVideoPromptChange} onScriptChange={pbHandleScriptChange} isVoiceOverEnabled={pbGenerateVo} addBackgroundMusic={pbAddMusic} />))}</div>
                    </div>
                </main>
              ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-gray-50 md:order-1">
                    <div className="max-w-md">
                        <PersonalBrandingIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <h2 className="mt-4 text-xl font-bold text-gray-800">Konten Personal Branding</h2>
                        <p className="mt-2 text-gray-500">
                           Gunakan masukan dari audiens dan inspirasi dari konten lain untuk membuat video yang otentik dan menarik. Mulai dengan mengisi panel di sebelah kanan.
                        </p>
                    </div>
                </div>
              )}
            </div>
          )}

        </div>
    </div>
  );
};

export default App;
