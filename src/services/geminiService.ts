import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function* transcribeAndAnalyzeEnToTh(audioBlob: Blob) {
  const base64Audio = await blobToBase64(audioBlob);
  
  const prompt = `You are a world-class executive consultant, strategic advisor, and linguistic expert advising a global executive. 
Listen to the following English audio carefully.
Please provide an exceptionally deep, structured, and professional response in Thai with the following sections. Ensure your analysis considers relevant global business trends, cultural nuances, and current events to provide contextually appropriate and insightful recommendations. 
**Crucially, maintain word-for-word accuracy for the translation section while minimizing latency.**

### 1. คำแปลตรงตัวและบริบททางภาษาและวัฒนธรรม (Word-for-Word Translation & Linguistic/Cultural Context)
[แปลเนื้อหาเป็นภาษาไทยแบบคำต่อคำให้แม่นยำที่สุด พร้อมอธิบายสำนวน คำศัพท์เฉพาะทาง นัยยะสำคัญ และบริบททางวัฒนธรรมที่ซ่อนอยู่เพื่อให้เข้าใจความหมายที่แท้จริงอย่างลึกซึ้ง]

### 2. บทสรุปผู้บริหาร (Executive Summary)
[สรุปประเด็นหลัก (Key Points) และความหมายแฝง (Nuances) อย่างกระชับแต่ครอบคลุม โดยเชื่อมโยงกับบริบททางธุรกิจและสถานการณ์ปัจจุบัน]

### 3. การวิเคราะห์เชิงลึกและแนวโน้มที่อาจเกิดขึ้น (Deep Analysis & Future Trends)
- **การวิเคราะห์ตรรกะและนัยสำคัญ (Logical Deconstruction & Nuances):** แยกแยะเหตุผล นัยสำคัญ และเจตนาแฝงที่ซ่อนอยู่ภายใต้น้ำเสียงและบริบท
- **บริบทแวดล้อมและแนวโน้มโลก (Global Trends):** วิเคราะห์ความเชื่อมโยงกับแนวโน้มธุรกิจระดับโลก เศรษฐกิจ หรือเหตุการณ์ปัจจุบันที่เกี่ยวข้อง และคาดการณ์แนวโน้มที่อาจเกิดขึ้นในอนาคต (Potential Trends)

### 4. มุมมองเชิงกลยุทธ์และคำแนะนำ (Strategic Insights & Recommendations)
- **ผลกระทบเชิงลึก (In-depth Impacts):** วิเคราะห์ผลกระทบระยะสั้นและระยะยาวต่อองค์กรระดับโลก
- **ข้อเสนอแนะเชิงรุก 3 ข้อ (3 Proactive Recommendations):** ให้คำแนะนำเพิ่มเติมเชิงกลยุทธ์ที่นำไปปฏิบัติได้จริงและมีพลัง

### 5. สถานการณ์จำลองและกรณีศึกษาที่คาดไม่ถึง (3-5 Diverse & Unexpected Scenarios)
[ให้คำอธิบายโดยละเอียดและยกตัวอย่างสถานการณ์ที่หลากหลายและคาดไม่ถึง 3-5 ตัวอย่าง ในโลกธุรกิจหรือสังคม เพื่อให้เห็นภาพการนำข้อมูลนี้ไปประยุกต์ใช้อย่างชัดเจนและลึกซึ้ง]`;

  let responseStream;
  try {
    responseStream = await retryWithBackoff(() => ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Audio, mimeType: audioBlob.type } },
            { text: prompt }
          ]
        }
      ]
    }));
  } catch (error: any) {
    console.error("Error in transcribeAndAnalyzeEnToTh:", error);
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      yield "ขออภัยครับ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    } else {
      yield "ขออภัยครับ ระบบขัดข้อง ไม่สามารถวิเคราะห์เสียงได้ในขณะนี้";
    }
    return;
  }

  try {
    for await (const chunk of responseStream) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error iterating stream:", error);
    yield "\n\n(การเชื่อมต่อขัดข้อง - ข้อมูลอาจไม่ครบถ้วน)";
  }
}


async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000,
  factor: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for transient errors or quota limits
    const isTransientError = 
      error?.status === 503 || 
      error?.code === 503 ||
      error?.status === 429 ||
      error?.code === 429 ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('UNAVAILABLE');

    if (retries > 0 && isTransientError) {
      const currentDelay = error?.status === 429 ? delay * 2 : delay;
      console.warn(`API Busy or Quota Exceeded (${error?.status || error?.code}). Retrying... attempts left: ${retries}. Waiting ${currentDelay}ms.`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      return retryWithBackoff(fn, retries - 1, currentDelay * factor, factor);
    }
    throw error;
  }
}

export async function analyzeImage(imageBlob: Blob, userPrompt?: string, mode: 'detailed' | 'concise' = 'detailed'): Promise<string> {
  const base64Image = await blobToBase64(imageBlob);
  
  const systemInstruction = mode === 'concise' 
    ? `You are a professional visual analyst and executive assistant advising a global executive. 
Provide a very concise, high-level summary of the image's strategic significance, considering relevant business, cultural, and current event contexts.
Predict potential trends based on the visual data and provide 2-3 actionable recommendations.
Focus only on the most critical takeaways and actionable insights.
Respond in Thai in a professional and structured manner.`
    : `You are a professional visual analyst and executive assistant advising a global executive. 
Analyze the provided image in great detail. 
Identify objects, text, context, and any strategic significance. 
Ensure your analysis considers relevant global business trends, cultural nuances, and current events to provide contextually appropriate and insightful observations.
Predict potential future trends based on the image and provide 2-3 additional strategic recommendations.
Respond in Thai in a professional and structured manner.`;

  const defaultPrompt = mode === 'concise' 
    ? "สรุปสาระสำคัญเชิงกลยุทธ์ของรูปภาพนี้อย่างกระชับ โดยคำนึงถึงบริบททางธุรกิจและวัฒนธรรม พร้อมคาดการณ์แนวโน้มและให้คำแนะนำ 2-3 ข้อ" 
    : "ช่วยวิเคราะห์รูปภาพนี้อย่างละเอียดในมุมมองของผู้ช่วยบริหารระดับโลก พร้อมเชื่อมโยงกับสถานการณ์ปัจจุบัน คาดการณ์แนวโน้มที่อาจเกิดขึ้น และให้คำแนะนำเพิ่มเติม 2-3 ข้อ";
    
  const prompt = userPrompt || defaultPrompt;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType: imageBlob.type } },
            { text: prompt }
          ]
        }
      ],
      config: {
        systemInstruction,
      }
    }));

    return response.text || "ไม่สามารถวิเคราะห์รูปภาพได้ในขณะนี้";
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    if (error?.status === 503 || error?.message?.includes('high demand')) {
      return "ขออภัยครับ ระบบ AI กำลังทำงานหนักในขณะนี้ กรุณาลองใหม่อีกครั้งในอีกสักครู่";
    }
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return "ขออภัยครับ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    }
    return "เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ กรุณาลองใหม่อีกครั้ง";
  }
}

export async function getDailyExecutiveBriefing(count: number = 10, userLocation?: { lat: number, lng: number }): Promise<string> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  let locationContext = "";
  if (userLocation) {
    locationContext = `พิกัดปัจจุบันของผู้ใช้งานคือ ละติจูด: ${userLocation.lat}, ลองจิจูด: ${userLocation.lng}. `;
  }

  const prompt = `Today is ${new Date().toLocaleDateString('en-US')}. ${locationContext}
As a Strategic Global Analyst and AI Consultant advising a top-tier global executive, please curate and analyze critical global issues from yesterday (${dateStr}).
This is for an internal "Global Issues Analysis & Solutions Initiative" project.

Please provide a structured report in Thai (but keep technical terms in English where appropriate) with 2 main sections. Ensure your analysis considers business, cultural, and current event contexts to provide insightful and contextually appropriate summaries and examples:

### Part 1: Critical Global Issues Analysis (Top ${count} Issues)
Focus on: Humanitarian crises, Environmental disasters, Geopolitical conflicts, Economic instability, or Emerging threats.
For each issue, provide:
1.  **Topic:** Clear and concise title.
2.  **Situation Summary:** What happened yesterday? (Cite sources/news if possible). Incorporate cultural and business context where relevant.
3.  **Location:** Specific country/region.
4.  **Strategic Impact & Trend Prediction:** Why does this matter to a global executive? Who is affected? What are the economic or geopolitical ripple effects? Predict future trends based on this issue.
5.  **2-3 Strategic Recommendations:** Provide 2-3 actionable recommendations or preliminary ideas for solutions that we can discuss further. (e.g., "How can AI help here?", "What policy change is needed?")

### Part 2: Innovation & Hope (5 Stories)
Focus on: Technological breakthroughs, Community-led solutions, or Positive human stories that offer hope for solving global problems. Highlight how these innovations intersect with global business trends or cultural shifts.

Use Google Search to ensure all data is current and factual from yesterday.
Format as a clean, professional Markdown report suitable for executive review.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      }
    }));

    return response.text || "ขออภัยครับ ไม่สามารถดึงข้อมูลสรุปประจำวันได้ในขณะนี้";
  } catch (error: any) {
    console.error("Error getting daily briefing:", error);
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return "ขออภัยครับ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    }
    return "ขออภัยครับ ไม่สามารถดึงข้อมูลสรุปประจำวันได้ในขณะนี้ เนื่องจากระบบขัดข้อง";
  }
}

const CACHE_PREFIX = 'gem_trans_cache_';
const MAX_CACHE_ENTRIES = 250;

/**
 * Retrieve cached translation if available
 */
function getTranslationFromCache(direction: string, text: string): string | null {
  try {
    const normalized = text.trim();
    if (!normalized) return null;
    const cacheKey = `${CACHE_PREFIX}${direction}_${normalized}`;
    const cachedItem = localStorage.getItem(cacheKey);
    if (!cachedItem) return null;
    
    const parsed = JSON.parse(cachedItem);
    return typeof parsed.text === 'string' ? parsed.text : null;
  } catch (err) {
    console.warn("Translation cache read error:", err);
    return null;
  }
}

/**
 * Save translation to localStorage cache with LRU cleanup to prevent quota overflow
 */
function setTranslationToCache(direction: string, text: string, translation: string): void {
  try {
    const normalized = text.trim();
    if (!normalized || !translation) return;
    const cacheKey = `${CACHE_PREFIX}${direction}_${normalized}`;
    
    // Prune oldest keys if cache grows large
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keys.push(k);
        }
      }
      if (keys.length >= MAX_CACHE_ENTRIES) {
        // Remove 20% oldest entries
        keys.slice(0, Math.floor(MAX_CACHE_ENTRIES * 0.2)).forEach(k => localStorage.removeItem(k));
      }
    } catch {
      // Ignore pruning errors
    }

    localStorage.setItem(cacheKey, JSON.stringify({
      text: translation,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn("Translation cache write error:", err);
  }
}

export function clearTranslationCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn("Error clearing translation cache:", err);
  }
}

export async function translateThToEn(audioBlob: Blob): Promise<string> {
  const base64Audio = await blobToBase64(audioBlob);
  
  const prompt = `You are an executive assistant. Listen to the following Thai audio and translate it to English. Only output the English translation, nothing else.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Audio, mimeType: audioBlob.type } },
            { text: prompt }
          ]
        }
      ]
    }));

    return response.text || "";
  } catch (error) {
    console.error("Error translating audio:", error);
    return "";
  }
}

export async function translateTextThToEn(text: string): Promise<string> {
  return translateText(text, 'TH_EN');
}

export async function translateText(text: string, direction: 'TH_EN' | 'EN_TH'): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  // 1. Check localStorage cache for instant zero-latency retrieval
  const cached = getTranslationFromCache(direction, trimmed);
  if (cached) {
    return cached;
  }

  const targetLang = direction === 'TH_EN' ? 'English' : 'Thai';
  const sourceLang = direction === 'TH_EN' ? 'Thai' : 'English';
  
  const prompt = `You are a professional executive advisor and translation expert. Translate the following ${sourceLang} text to ${targetLang} with strict word-for-word accuracy while maintaining a professional and formal tone.
Focus on speed, precision, and maintaining the original nuances of the text.
Only output the translated text, nothing else.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            { text: `${prompt}\n\nText to translate: ${trimmed}` }
          ]
        }
      ]
    }));

    const result = response.text || "";
    if (result && !result.startsWith("ขออภัยครับ")) {
      setTranslationToCache(direction, trimmed, result);
    }
    return result;
  } catch (error: any) {
    console.error("Error translating text:", error);
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return "ขออภัยครับ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    }
    return "ขออภัยครับ เกิดข้อผิดพลาดในการแปลภาษา";
  }
}

export async function* getConsultantResponse(message: string, context?: string, history: { role: 'user' | 'model' | 'bot', content: string }[] = []) {
  const systemInstruction = `You are a world-class executive consultant and strategic advisor to a global executive. 
Your role is to provide deep insights, advice, and suggestions based on the user's questions.
Ensure your analysis identifies key points (ประเด็นหลัก), cultural and business nuances (ความหมายแฝง), and potential future trends (แนวโน้มที่อาจเกิดขึ้น).
Provide detailed explanations and **3-5 diverse and unexpected examples (ตัวอย่างที่หลากหลายและคาดไม่ถึง)** for each major point.
Maintain a professional, encouraging, and highly intelligent tone.
Respond in Thai. Focus on speed and real-time responsiveness while maintaining exceptional depth.`;

  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user',
      parts: [{ text: context ? `Context Analysis:\n${context}\n\nUser Question: ${message}` : message }]
    }
  ];

  try {
    const responseStream = await retryWithBackoff(() => ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }],
      }
    }));

    for await (const chunk of responseStream) {
      yield chunk.text;
    }
  } catch (error: any) {
    console.error("Error getting consultant response:", error);
    if (error?.status === 503 || error?.message?.includes('high demand')) {
      yield "ขออภัยครับ ระบบ AI กำลังทำงานหนักในขณะนี้ กรุณาลองใหม่อีกครั้งในอีกสักครู่";
    } else if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      yield "ขออภัยครับ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    } else {
      yield "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI";
    }
  }
}

export async function translateAndSpeak(audioBlob: Blob): Promise<{ text: string, audioUrl: string | null }> {
  try {
    const text = await translateThToEn(audioBlob);
    if (!text) {
      return { text: "ขออภัยครับ ไม่สามารถแปลเสียงได้", audioUrl: null };
    }
    const audioUrl = await generateSpeech(text);
    return { text, audioUrl };
  } catch (error) {
    console.error("Error in translateAndSpeak:", error);
    return { text: "ขออภัยครับ เกิดข้อผิดพลาดในการแปลและสร้างเสียง", audioUrl: null };
  }
}

export async function translateTextAndSpeak(thaiText: string): Promise<{ text: string, audioUrl: string | null }> {
  try {
    const text = await translateTextThToEn(thaiText);
    if (!text) {
      return { text: "ขออภัยครับ ไม่สามารถแปลข้อความได้", audioUrl: null };
    }
    const audioUrl = await generateSpeech(text);
    return { text, audioUrl };
  } catch (error) {
    console.error("Error in translateTextAndSpeak:", error);
    return { text: "ขออภัยครับ เกิดข้อผิดพลาดในการแปลและสร้างเสียง", audioUrl: null };
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return pcmBase64ToWavUrl(base64Audio, 24000);
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}

function pcmBase64ToWavUrl(pcmBase64: string, sampleRate: number = 24000): string {
  const binaryString = window.atob(pcmBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(view, 8, 'WAVE');

  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 channel)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);

  // Write PCM data
  const pcmData = new Uint8Array(buffer, 44);
  pcmData.set(bytes);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export async function generateImage(
  prompt: string, 
  size: "1K" | "2K" | "4K" = "1K",
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
  style?: string
): Promise<string | null> {
  try {
    const finalPrompt = style ? `${prompt}, in ${style} style` : prompt;
    const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

    const response = await retryWithBackoff(() => imageAi.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: size
        },
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error?.status === 503 || error?.message?.includes('high demand')) {
      throw new Error("ขออภัยครับ ระบบสร้างรูปภาพกำลังทำงานหนักในขณะนี้ กรุณาลองใหม่อีกครั้งในอีกสักครู่");
    }
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("ขออภัยครับ โควตาการสร้างรูปภาพของคุณเต็มแล้ว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง");
    }
    throw error;
  }
}

export async function editImage(imageBlob: Blob, prompt: string): Promise<string | null> {
  const base64Image = await blobToBase64(imageBlob);
  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: imageBlob.type,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error editing image:", error);
    if (error?.status === 503 || error?.message?.includes('high demand')) {
      throw new Error("ขออภัยครับ ระบบแก้ไขรูปภาพกำลังทำงานหนักในขณะนี้ กรุณาลองใหม่อีกครั้งในอีกสักครู่");
    }
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("ขออภัยครับ โควตาการแก้ไขรูปภาพของคุณเต็มแล้ว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง");
    }
    throw error;
  }
}

export async function* analyzeTextStream(
  text: string, 
  language: 'English' | 'Thai', 
  mode: 'thinking' | 'search' | 'standard' | 'maps' = 'search'
) {
  const prompt = `As a world-class Strategic AI Consultant advising a global executive, perform a rigorous "Adversarial Audit" and "Future Trend Prediction" on the following ${language} text.

YOUR MANDATORY AUDIT LOGIC:
1. Identify main points (ประเด็นหลัก) and analyze the input text thoroughly.
2. Identify nuances and hidden meanings (ความหมายแฝง).
3. Predict potential future trends (แนวโน้มที่อาจเกิดขึ้น) for the next 3-5 years.
4. Provide detailed explanations and **3-5 diverse and unexpected examples (ตัวอย่างที่หลากหลายและคาดไม่ถึง)**.
5. ${mode === 'maps' ? 'USE GOOGLE MAPS to find location-based data, nearby places, or geographical context relevant to this topic.' : 'USE GOOGLE SEARCH to find conflicting opinions, counter-arguments, or alternative data points regarding this topic.'}
6. If conflicts are found, you MUST explicitly state "AUDIT RESULT: CONFLICT DETECTED".
7. You must adjudicate the conflict. Do not be superficial. Explain why the initial analysis holds or why it must be revised based on the conflicting evidence.
8. If the conflict is too strong to resolve, you MUST flag this as "INSUFFICIENT DATA FOR EXECUTIVE DECISION".

Provide the final report in Thai with these sections:

### 1. การวิเคราะห์เบื้องต้นและประเด็นสำคัญ (Initial Strategic Analysis & Key Points)
[Deep analysis of the input, identifying main points and nuances.]

### 2. ผลการตรวจสอบเชิงโต้แย้ง (Adversarial Audit Report)
[List ${mode === 'maps' ? 'geographical insights and location data found via Maps' : 'conflicting opinions found via search'}. If none, state "No significant evidence found."]

### 3. การตัดสินข้อขัดแย้ง (Adjudication & Reconciliation)
[If conflict exists, explain why you choose your final stance. If no conflict, explain why the stance is robust.]

### 4. การคาดการณ์แนวโน้มและนวัตกรรมในอนาคต (Future Trends & Innovations)
[Predict potential trends, shifts, and innovations based on the input and global context for the next 3-5 years.]

### 5. สถานการณ์จำลองและตัวอย่างที่คาดไม่ถึง (3-5 Unexpected Scenarios & Examples)
[Provide 3-5 diverse and unexpected examples/scenarios that illustrate the potential impact of these trends.]

### 6. คำแนะนำเชิงกลยุทธ์สำหรับผู้บริหารสูงสุด (Executive Verdict & Recommendations)
[Provide 3 actionable, high-impact strategic recommendations. These must be concrete, proactive, and tailored for a global executive.]

Text to analyze:
${text}`;

  try {
    let model = "gemini-3.6-flash";
    let config: any = {
      systemInstruction: "You are an expert Strategic AI Consultant. You are ruthless about accuracy. If evidence is conflicting, you do not guess; you audit and adjudicate. You provide deep, forward-looking insights for C-suite executives.",
    };

    if (mode === 'thinking') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      model = "gemini-3.1-pro-preview";
    } else if (mode === 'search') {
      model = "gemini-3.6-flash";
      config.tools = [{ googleSearch: {} }];
    } else if (mode === 'maps') {
      model = "gemini-3.6-flash";
      config.tools = [{ googleMaps: {} }];
    }

    const responseStream = await retryWithBackoff(() => ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config
    }));

    for await (const chunk of responseStream) {
      yield chunk.text;
    }
  } catch (error: any) {
    console.error("Error analyzing text stream:", error);
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      yield "ขออภัยครับ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
    } else {
      yield "ขออภัยครับ เกิดข้อผิดพลาดในการวิเคราะห์ข้อความ";
    }
  }
}

export async function analyzeText(
  text: string, 
  language: 'English' | 'Thai', 
  mode: 'thinking' | 'search' | 'standard' | 'maps' = 'search',
  userId?: string
): Promise<string> {
  const stream = analyzeTextStream(text, language, mode);
  let fullText = "";
  for await (const chunk of stream) {
    fullText += chunk;
  }

  // Auto-save to Firestore if userId is provided
  if (userId && fullText && !fullText.includes("ขออภัยครับ")) {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        user_id: userId,
        input_text: text,
        audit_result: fullText,
        is_public: false,
        created_at: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to auto-save audit log:", e);
    }
  }

  return fullText;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function improvePrompt(prompt: string, type: 'image' | 'video'): Promise<string> {
  try {
    const systemInstruction = type === 'image' 
      ? "You are an expert at writing prompts for AI image generation. Enhance the user's prompt to be more descriptive, detailed, and effective for generating high-quality images. Add relevant keywords for lighting, composition, style, and mood if they are missing. Return ONLY the improved prompt text, nothing else."
      : "You are an expert at writing prompts for AI video generation. Enhance the user's prompt to be more descriptive, focusing on motion, camera movement, lighting, and cinematic qualities. Return ONLY the improved prompt text, nothing else.";

    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    }));

    return response.text?.trim() || prompt;
  } catch (error) {
    console.error("Error improving prompt:", error);
    return prompt; // Fallback to original prompt on error
  }
}
export async function generateVideoFromImage(
  imageBlob: Blob,
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string | null> {
  const base64Image = await blobToBase64(imageBlob);
  try {
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
    let operation = await retryWithBackoff(() => videoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: base64Image,
        mimeType: imageBlob.type,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    }));

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      try {
        operation = await retryWithBackoff(() => videoAi.operations.getVideosOperation({operation: operation}));
      } catch (pollError: any) {
        console.warn("Polling error (might be transient):", pollError);
        // If it's a quota error during polling, we should ideally wait longer
        if (pollError?.status === 429 || pollError?.message?.includes('quota')) {
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
        // Continue loop and try again
        continue;
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });
      const videoBlob = await response.blob();
      return URL.createObjectURL(videoBlob);
    }
    return null;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("ขออภัยครับ โควตา API ของคุณเต็มแล้ว กรุณารอสักครู่ (ประมาณ 1 นาที) แล้วลองใหม่อีกครั้งครับ");
    }
    console.error("Error generating video:", error);
    const errorStr = String(error);
    if (errorStr.includes('PERMISSION_DENIED') || errorStr.includes('403') || errorStr.includes('Requested entity was not found')) {
      throw new Error("API Key error or permission denied. Please re-select your API key from a paid Google Cloud project.");
    }
    throw error;
  }
}
