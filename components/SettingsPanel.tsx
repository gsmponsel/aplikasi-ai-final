
import React from 'react';
import ImageUploader from './ImageUploader';
import Switch from './Switch';
import { SCENE_STRUCTURES } from '../constants';
import { SceneStructure } from '../types';

interface SettingsPanelProps {
    productImage: File | null;
    modelImage: File | null;
    productName: string;
    additionalBrief: string;
    sceneStructureId: string;
    ugcSceneCount: number;
    generateVoiceOver: boolean;
    addBackgroundMusic: boolean;
    ctaPerScene: boolean;
    onProductImageUpload: (file: File) => void;
    onModelImageUpload: (file: File) => void;
    onProductNameChange: (name: string) => void;
    onAdditionalBriefChange: (brief: string) => void;
    onSceneStructureChange: (id: string) => void;
    onUgcSceneCountChange: (count: number) => void;
    onGenerateVoiceOverChange: (enabled: boolean) => void;
    onAddBackgroundMusicChange: (enabled: boolean) => void;
    onCtaPerSceneChange: (enabled: boolean) => void;
    onGenerate: () => void;
    apiKeySelected: boolean;
    onSelectKey: () => void;
    isLoading: boolean;
    error: string | null;
    className?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = (props) => {
    const {
        productName, onProductNameChange,
        additionalBrief, onAdditionalBriefChange,
        sceneStructureId, onSceneStructureChange,
        ugcSceneCount, onUgcSceneCountChange,
        generateVoiceOver, onGenerateVoiceOverChange,
        addBackgroundMusic, onAddBackgroundMusicChange,
        ctaPerScene, onCtaPerSceneChange,
        onProductImageUpload, onModelImageUpload,
        onGenerate, apiKeySelected, onSelectKey, isLoading, error,
        className = ''
    } = props;
    
    const currentStructure = SCENE_STRUCTURES.find(s => s.id === sceneStructureId);
    const isTopicBased = sceneStructureId === 'talking-head-awareness' || sceneStructureId === 'storytelling-camera';
    const productRequired = currentStructure?.requiredParts.includes('product') ?? true;
    
    const canGenerate = productName && (productRequired ? props.productImage : true) && apiKeySelected && !isLoading;

    return (
        <aside className={`w-full md:w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col ${className}`}>
            <header className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Unggah & Pengaturan</h2>
                <p className="text-xs text-gray-500">Konfigurasi prompt Anda</p>
            </header>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* Show Product Uploader only if required by the structure */}
                {productRequired && (
                    <ImageUploader id="product" title="Gambar Produk" onImageUpload={onProductImageUpload} disabled={isLoading} />
                )}
                
                <ImageUploader 
                    id="model" 
                    title="Gambar Model / Figur Utama" 
                    onImageUpload={onModelImageUpload} 
                    disabled={isLoading} 
                    isOptional={false} 
                />
                
                <div>
                    <label htmlFor="product-name" className="text-sm font-semibold text-gray-600 mb-2 block">
                        {isTopicBased ? "Judul Video / Topik" : "Nama Produk"}
                    </label>
                    <input
                        type="text"
                        id="product-name"
                        value={productName}
                        onChange={(e) => onProductNameChange(e.target.value)}
                        placeholder={isTopicBased ? "Contoh: 'Tips Karir', 'Curhat Hari Ini'" : "Contoh: 'Serum HydraGlow'"}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="scene-structure" className="text-sm font-semibold text-gray-600 mb-2 block">Kategori & Gaya</label>
                    <select
                        id="scene-structure"
                        value={sceneStructureId}
                        onChange={(e) => onSceneStructureChange(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {SCENE_STRUCTURES.map((structure: SceneStructure) => (
                            <option key={structure.id} value={structure.id}>{structure.name}</option>
                        ))}
                    </select>
                </div>

                 <div>
                    <label htmlFor="ugc-scene-count" className="text-sm font-semibold text-gray-600 mb-2 block">Jumlah Adegan</label>
                    <select
                        id="ugc-scene-count"
                        value={ugcSceneCount}
                        onChange={(e) => onUgcSceneCountChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500"
                        disabled={isLoading}
                    >
                        <option value="4">4 Adegan (Default)</option>
                        <option value="6">6 Adegan</option>
                        <option value="8">8 Adegan</option>
                        <option value="10">10 Adegan</option>
                        <option value="12">12 Adegan (Maks)</option>
                    </select>
                </div>
                
                 <div>
                    <label htmlFor="additional-brief" className="text-sm font-semibold text-gray-600 mb-2 block">Instruksi Spesifik (Opsional)</label>
                    <textarea
                        id="additional-brief"
                        rows={3}
                        value={additionalBrief}
                        onChange={(e) => onAdditionalBriefChange(e.target.value)}
                        placeholder="Contoh: Fokus pada suasana yang ceria, atau detail poin bicara..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                    <Switch label="Buat Voice Over" enabled={generateVoiceOver} onChange={onGenerateVoiceOverChange} disabled={isLoading} />
                    <Switch label="Tambah Musik Latar" enabled={addBackgroundMusic} onChange={onAddBackgroundMusicChange} disabled={isLoading} />
                    {!isTopicBased && (
                         <Switch label="CTA Tiap Scene (Hard Sell)" enabled={ctaPerScene} onChange={onCtaPerSceneChange} disabled={isLoading} />
                    )}
                </div>
            </div>

            <footer className="p-4 border-t border-gray-200 bg-white">
                <div className="text-xs text-gray-500 mb-4 text-center">
                    Catatan: Pembuatan video memakan banyak sumber daya. Mohon pantau{' '}
                    <a href="https://ai.dev/usage?tab=rate-limit" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                        dasbor kuota
                    </a>{' '}
                    Anda untuk menghindari gangguan.
                </div>
                {!apiKeySelected ? (
                    <div className="flex flex-col items-center text-center">
                        <p className="mb-2 text-sm text-red-500 font-medium">Pembuatan video memerlukan Kunci API.</p>
                        <p className="mb-3 text-xs text-gray-500">Ini mungkin dikenakan biaya. Lihat 
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline"> dokumen penagihan</a>.
                        </p>
                        <button onClick={onSelectKey} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            Pilih Kunci API
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={onGenerate} 
                        disabled={!canGenerate}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-xl">✨</span>
                        {isLoading ? 'Membuat...' : 'Buat Konten UGC'}
                    </button>
                )}
                {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </footer>
        </aside>
    );
};

export default SettingsPanel;
