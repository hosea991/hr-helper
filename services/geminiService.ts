import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("未找到 API Key");
  }
  return new GoogleGenAI({ apiKey });
};

// Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part (e.g., "data:audio/wav;base64,")
      const base64Content = base64String.split(",")[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudioNames = async (audioBlob: Blob): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const base64Audio = await blobToBase64(audioBlob);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || "audio/webm",
              data: base64Audio,
            },
          },
          {
            text: "请仔细听这段音频。其中包含朗读的名字列表。请转录这些名字，并以字符串的 JSON 列表形式返回。忽略任何填充词，只保留名字。",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

export const cleanNameList = async (rawText: string): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `从以下文本中提取清晰的名字列表。文本可能包含 CSV 数据、带有换行符的纯文本或混合格式。仅返回字符串的 JSON 数组。需要处理的文本：\n\n${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Cleaning error:", error);
    // Fallback simple split if AI fails
    return rawText.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
  }
};

export const generateGroupNames = async (groups: {id: string, members: {name: string}[]}[]): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const simplifiedGroups = groups.map(g => g.members.map(m => m.name));
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `这里有几组人员：${JSON.stringify(simplifiedGroups)}。请为每组生成一个有创意、专业且有趣的中文队名。返回一个与群组顺序对应的字符串 JSON 数组。`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
         const jsonText = response.text;
         if (!jsonText) return groups.map((_, i) => `第 ${i + 1} 组`);
         return JSON.parse(jsonText);

    } catch (error) {
        return groups.map((_, i) => `第 ${i + 1} 组`);
    }
}
