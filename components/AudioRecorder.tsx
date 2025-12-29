import React, { useState, useRef } from 'react';
import { transcribeAudioNames } from '../services/geminiService';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';

interface AudioRecorderProps {
  onNamesTranscribed: (names: string[]) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onNamesTranscribed }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const names = await transcribeAudioNames(audioBlob);
          onNamesTranscribed(names);
        } catch (error) {
          alert('音频转录失败。请检查您的 API Key 并重试。');
        } finally {
          setIsProcessing(false);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 border border-indigo-100 bg-indigo-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
        <Sparkles className="w-4 h-4" />
        <span>Gemini 语音录入</span>
      </div>
      <p className="text-xs text-indigo-500 text-center mb-2">
        大声朗读名单，AI 将自动识别并添加。
      </p>
      
      {isProcessing ? (
        <button disabled className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-slate-600 rounded-full cursor-not-allowed">
          <Loader2 className="w-5 h-5 animate-spin" />
          处理音频中...
        </button>
      ) : isRecording ? (
        <button 
          onClick={stopRecording} 
          className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all animate-pulse shadow-md"
        >
          <Square className="w-5 h-5 fill-current" />
          停止并识别
        </button>
      ) : (
        <button 
          onClick={startRecording} 
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all shadow-md"
        >
          <Mic className="w-5 h-5" />
          开始录音
        </button>
      )}
    </div>
  );
};
