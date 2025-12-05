
import { GoogleGenAI, Part, Type, Modality, GenerateContentResponse } from "@google/genai";
import { SceneStructure } from "../types";

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const getAiClient = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

// Helper function untuk delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// INSTRUCTIONS TO FORCE CONSISTENCY IN IMAGE GENERATION
// UPDATED: More aggressive instructions for identity preservation and object isolation
const STRICT_IMAGE_GENERATION_RULES = `
[SYSTEM INSTRUCTION: MULTI-IMAGE COMPOSITING RULES]

ROLE ASSIGNMENT FOR INPUT IMAGES:
1. PRODUCT IMAGE (First Input):
   - ROLE: OBJECT REFERENCE ONLY.
   - ACTION: Extract the PRODUCT/ITEM shown.
   - NEGATIVE PROMPT: IGNORE any human face, hands, skin, or body parts visible in this specific image. DO NOT transfer the identity from the product photo.

2. MODEL IMAGE (Second Input - if provided):
   - ROLE: IDENTITY & SUBJECT REFERENCE.
   - ACTION: The main character in the generated image MUST look exactly like this person. Copy facial features, hair, and body type.
   - REQUIREMENT: Maintain 100% facial consistency with this input.

COMPOSITION RULES:
- Create a realistic photo where the character from [MODEL IMAGE] is interacting with the item from [PRODUCT IMAGE].
- STYLE: Photorealistic, High Resolution, Social Media Aesthetic (UGC).
- LIGHTING: Natural, Flattering, consistent with the scene description.
- NO HALLUCINATIONS: Do not generate extra limbs, distorted text, or morphed faces.
`;

export const generateUgcPlan = async (
    planningPrompt: string,
    sceneCount: number
): Promise<any[]> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        script: { type: Type.STRING },
                        image_prompt: { type: Type.STRING },
                        video_prompt: { type: Type.STRING },
                        overlay_text: { type: Type.STRING },
                        caption: { type: Type.STRING },
                    },
                    required: ['title', 'description', 'script', 'image_prompt', 'video_prompt', 'overlay_text', 'caption']
                }
            }
        },
        required: ['scenes']
    };

    const response = await ai.models.generateContent({
        model,
        contents: planningPrompt,
        config: { responseMimeType: "application/json", responseSchema }
    });

    const data = JSON.parse(response.text);
    if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length !== sceneCount) {
        console.error(`Invalid AI response structure. Expected ${sceneCount} scenes, but got:`, data);
        throw new Error(`AI memberikan respon tidak valid. Diharapkan ${sceneCount} adegan, tetapi tidak diterima.`);
    }
    return data.scenes;
};


export const generateUgcImages = async (
  imagePrompts: string[],
  imageParts: { product: Part, model?: Part }
): Promise<string[]> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-image';
    
    const allParts = [imageParts.product];
    if (imageParts.model) {
        allParts.push(imageParts.model);
    }

    const generatedImages: string[] = [];

    // Ubah dari Promise.all (Paralel) menjadi For Loop (Sekuensial) dengan Delay
    for (let i = 0; i < imagePrompts.length; i++) {
        const prompt = imagePrompts[i] + STRICT_IMAGE_GENERATION_RULES;
        try {
            const response = await ai.models.generateContent({
                model,
                contents: { parts: [...allParts, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (!imagePart?.inlineData) {
                console.error(`Image generation response missing inlineData for scene ${i + 1}:`, JSON.stringify(response, null, 2));
                throw new Error(`Respon kosong dari AI.`);
            }
            
            generatedImages.push(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);

        } catch (err: any) {
            console.error(`Image generation failed for scene ${i + 1}:`, err);
            // Jika error limit, kita coba lempar error spesifik
            if (err.message && err.message.includes("429")) {
                throw new Error(`Terkena batasan kuota (Rate Limit) saat membuat gambar ke-${i+1}. Mohon tunggu sebentar sebelum mencoba lagi.`);
            }
            throw new Error(`Gagal membuat gambar adegan ${i + 1}: ${err.message}`);
        }

        // Tambahkan delay 3 detik antar request untuk menghindari Rate Limit (429)
        if (i < imagePrompts.length - 1) {
            await delay(3000); 
        }
    }

    return generatedImages;
};

export const regenerateSingleImage = async (
    imagePrompt: string,
    imageParts: { product: Part, model?: Part }
): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-image';
    
    const allParts = [imageParts.product];
    if (imageParts.model) {
        allParts.push(imageParts.model);
    }

    const prompt = imagePrompt + STRICT_IMAGE_GENERATION_RULES;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [...allParts, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (!imagePart?.inlineData) {
        console.error("Image regeneration response was missing inlineData:", JSON.stringify(response, null, 2));
        throw new Error('Gagal membuat ulang gambar.');
    }
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};

export const generateVoiceOver = async (fullScript: string): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-preview-tts';

    const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: `Dengan nada yang ceria dan ramah dalam Bahasa Indonesia kasual, bacakan naskah berikut: ${fullScript}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // A friendly, consistent voice
                },
            },
        },
    });

    const audioPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!audioPart?.inlineData?.data) {
        throw new Error('Gagal membuat voice over.');
    }
    return `data:audio/mpeg;base64,${audioPart.inlineData.data}`;
};

export const generateVideoFromImage = async (
  imageBase64: string,
  animationPrompt: string,
  script: string,
  withBackgroundMusic: boolean
): Promise<string> => {
    const ai = getAiClient();
    const mimeType = imageBase64.split(';')[0].split(':')[1];
    const imageData = imageBase64.split(',')[1];
    
    // Specific instruction for Audio based on user preference
    const audioInstruction = withBackgroundMusic 
        ? 'AUDIO: Include subtle background music and speech.' 
        : 'AUDIO: Clear speech only. NO BACKGROUND MUSIC. The sound of the model speaking the script.';

    // Aggressive instruction for strict 9:16 Portrait video and visual consistency, plus negative constraints
    const baseInstructions = `
    STRICT OUTPUT FORMAT: (VERTICAL 9:16 ASPECT RATIO). The video must be 9:16 portrait. CROP THE INPUT IMAGE TO VERTICAL 9:16 TO FILL THE SCREEN. NO LETTERBOX. NO BLACK BARS.
    NEGATIVE CONSTRAINTS: DO NOT include any TEXT, SUBTITLES, CAPTIONS, WATERMARKS, or LOGOS. DO NOT morph the face. NO DISTORTION.
    VISUAL QUALITY: High definition, cinematic lighting, social media aesthetic.
    CONSISTENCY: The character's face and identity MUST remain exactly the same as the input image.
    ACTION: ${animationPrompt}. The model should be looking at the camera and speaking naturally.
    CONTEXT: The character is speaking this line: "${script}".
    ${audioInstruction}`;

    // We prepend "Vertical 9:16 video of..." to the prompt to reinforce the format to the model text encoder
    const fullPrompt = `(VERTICAL 9:16 VIDEO) ${animationPrompt}. ${baseInstructions}`;

    if (!window.aistudio || !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
        if (!(await window.aistudio.hasSelectedApiKey())) {
            throw new Error("Kunci API belum dipilih. Mohon pilih kunci API di panel pengaturan.");
        }
    }

    let operation;
    try {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: fullPrompt,
            image: {
                imageBytes: imageData,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });
    } catch(e: any) {
        if (e.message.includes("API key not valid")) {
             throw new Error("Kunci API tidak valid. Mohon pilih kunci API yang valid.");
        }
        throw e;
    }


    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    // Check for errors in the operation result
    if (operation.error) {
        console.error("Video generation operation failed:", operation.error);
        throw new Error(`Pembuatan video gagal: ${operation.error.message || 'Kesalahan tidak diketahui pada server AI'}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        console.error("No video link found in operation response:", operation);
        throw new Error('Pembuatan video gagal atau tidak mengembalikan tautan. Kemungkinan konten diblokir oleh filter keamanan.');
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        console.error("Video download failed:", errorText);
        if (errorText.includes("Requested entity was not found.")) {
            throw new Error("Entitas tidak ditemukan. Kunci API Anda mungkin tidak valid.");
        }
        throw new Error(`Gagal mengunduh video yang dihasilkan. Status: ${videoResponse.status}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-image';
   
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (!imagePart?.inlineData) {
        console.error("Image regeneration response was missing inlineData:", JSON.stringify(response, null, 2));
        throw new Error('Gagal membuat ulang gambar.');
    }
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};

export const generatePersonalBrandingContent = async (
    comments: string,
    referenceScript: string,
    additionalBrief: string,
    sceneCount: number
): Promise<{ scenes: { script: string, imagePrompt: string, overlay: string }[], images: string[] }> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';

    const prompt = `Anda adalah seorang ahli strategi konten media sosial yang berspesialisasi dalam personal branding.
    Analisis skrip referensi berikut untuk memahami hook, struktur, nada suara, dan gaya bicaranya: "${referenceScript}".
    Analisis komentar-komentar dari postingan sebelumnya ini untuk memahami pertanyaan, masalah, dan minat audiens: "${comments}".
    Berdasarkan analisis Anda, dan mengikuti instruksi tambahan ini (${additionalBrief || 'Tidak ada'}), buat konten untuk video gaya "talking-head" dengan ${sceneCount} adegan.
    Tujuannya adalah membangun merek pribadi dan melibatkan audiens berdasarkan masukan mereka.
    
    ATURAN PENTING:
    1. FORMAT: Semua image_prompt harus meminta "Vertical 9:16 portrait photo".
    2. KONSISTENSI: Pastikan visual orang tersebut konsisten.
    3. NASKAH: Singkat dan padat (MAX 30 kata per scene).
    
    Kembalikan objek JSON yang valid yang hanya berisi satu kunci: "scenes".
    Nilai dari "scenes" harus berupa array dari ${sceneCount} objek.
    Setiap objek dalam array harus memiliki tiga kunci STRING:
    1. "script": Naskah voice-over yang singkat dan menarik (MAKSIMAL 30 kata).
    2. "imagePrompt": Prompt visual yang sangat detail untuk generator gambar AI (rasio aspek 9:16 potret). Jelaskan ekspresi, pose, dan latar belakang orang tersebut dengan jelas. PENTING: Jangan sertakan teks atau logo apa pun pada gambar. Gunakan frasa "A vertical 9:16 portrait of..." di awal. Add "NO TEXT, NO WATERMARK".
    3. "overlay": Saran teks overlay dalam Bahasa Indonesia yang kasual dan natural. Teks ini harus berfungsi sebagai hook, ringkasan naskah, atau poin kunci yang menarik untuk audiens (maksimal 1 kalimat singkat).`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        script: { type: Type.STRING },
                        image_prompt: { type: Type.STRING },
                        overlay: { type: Type.STRING },
                    },
                    required: ['script', 'image_prompt', 'overlay']
                }
            }
        },
        required: ['scenes']
    };

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    const responseData = JSON.parse(response.text);

    const scenesFromAI = responseData.scenes;
    if (!scenesFromAI || !Array.isArray(scenesFromAI) || scenesFromAI.length !== sceneCount) {
        console.error(`Invalid AI response structure. Expected an array of ${sceneCount} scenes, but got:`, JSON.stringify(responseData, null, 2));
        throw new Error(`AI gagal menghasilkan struktur data yang valid. Harap coba lagi.`);
    }

    const scenesData: { script: string, imagePrompt: string, overlay: string }[] = [];
    for (let i = 0; i < scenesFromAI.length; i++) {
        const scene = scenesFromAI[i];
        const imagePrompt = scene.image_prompt;

        if (!imagePrompt || typeof imagePrompt !== 'string' || imagePrompt.trim() === '') {
            console.error(`Incomplete AI response for PB scene ${i + 1}: 'image_prompt' is missing or empty. Full response:`, JSON.stringify(responseData, null, 2));
            throw new Error(`AI gagal menghasilkan prompt gambar yang valid untuk Adegan ${i + 1}. Respon tidak lengkap atau salah format.`);
        }

        scenesData.push({
            script: scene.script || '',
            imagePrompt: imagePrompt,
            overlay: scene.overlay || '',
        });
    }

    // Ubah juga bagian Personal Branding menjadi sekuensial
    const images: string[] = [];
    for (let i = 0; i < scenesData.length; i++) {
        try {
            const img = await generateImageFromPrompt(scenesData[i].imagePrompt);
            images.push(img);
        } catch (err: any) {
             console.error(`Image generation failed for PB scene ${i + 1}:`, err);
             if (err.message && err.message.includes("429")) {
                 throw new Error(`Terkena batasan kuota (Rate Limit) saat membuat gambar personal branding ke-${i+1}.`);
             }
             throw new Error(`Gagal membuat gambar adegan ${i + 1}`);
        }

        // Delay 3 detik antar gambar
        if (i < scenesData.length - 1) {
            await delay(3000);
        }
    }

    return { scenes: scenesData, images };
};


export { fileToGenerativePart };
