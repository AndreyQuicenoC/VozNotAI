import React, { useState, useRef } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { validateAudioFile } from "../../utils/securityValidator.ts";
import { encodeBlobToWav } from "../../utils/wavEncoder.ts";
import type { AudioSession } from "../../types/index.ts";

interface QuickUploadModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (session: AudioSession) => void;
  onCreated?: (session: AudioSession) => void;
}

export const QuickUploadModal: React.FC<QuickUploadModalProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  onCreated,
}) => {
  const { currentUser, engineStatus, transcribeFile } = useVozNotStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  if (isOpen === false) return null;

  const handleFileSelect = (file: File) => {
    setError("");
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || "Archivo no válido");
      return;
    }
    setSelectedFile(file);
  };

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mediaRecorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || preferredMime || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setIsConverting(true);
        setStatusMessage("Convirtiendo la grabación a WAV...");
        void encodeBlobToWav(audioBlob)
          .then((wavBlob) => {
            const recordedFile = new File(
              [wavBlob],
              `Grabacion_Microfono_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.wav`,
              { type: "audio/wav" }
            );
            const validation = validateAudioFile(recordedFile);
            if (!validation.valid) {
              setSelectedFile(null);
              setError(validation.error || "La grabación convertida no es válida.");
              return;
            }
            setSelectedFile(recordedFile);
            setError("");
          })
          .catch(() => {
            setSelectedFile(null);
            setError("No se pudo convertir la grabación del micrófono a WAV.");
          })
          .finally(() => {
            setIsConverting(false);
            setStatusMessage("");
          });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      let elapsed = 0;
      recordTimerRef.current = window.setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (elapsed >= 120 && mediaRecorder.state === "recording") {
          if (recordTimerRef.current) clearInterval(recordTimerRef.current);
          setIsRecording(false);
          mediaRecorder.stop();
        }
      }, 1000);
    } catch {
      setError("No se pudo acceder al micrófono. Verifique los permisos del navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handleStartTranscription = () => {
    if (!selectedFile || isConverting || isRecording) {
      setError("Por favor seleccione un archivo de audio o grabe una nota.");
      return;
    }
    const file = selectedFile;
    onClose();
    const finishCallback = onSuccess || onCreated;
    if (finishCallback) {
      finishCallback({ id: "pending" } as AudioSession);
    }
    void transcribeFile(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#151b2c] rounded-2xl shadow-2xl border border-[#24293b] p-6 flex flex-col gap-5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent */}
        <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-[#48d9e8]/15 blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#48d9e8]/15 text-[#48d9e8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
            </div>
            <div>
              <h2 id="upload-modal-title" className="font-['Space_Grotesk'] text-lg font-semibold text-[#dde2f9]">
                Nueva Transcripción de Audio
              </h2>
              <p className="text-xs text-[#c5c5d7]">
                Inferencia Whisper con diarización de interlocutores y extracción de acuerdos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#191f30] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4 z-10">
          {/* File Drag and Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              selectedFile
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-[#24293b] hover:border-[#48d9e8]/60 bg-[#080e1e]/60 hover:bg-[#080e1e]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg,.webm"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <span className="material-symbols-outlined text-3xl mb-2 text-cyan-400">
              {selectedFile ? "audio_file" : "upload_file"}
            </span>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">{selectedFile.name}</p>
                <p className="text-[11px] text-emerald-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-200">
                  Haz clic para seleccionar o arrastra tu archivo aquí
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  WAV, MP3 o M4A, hasta 25 MB y 2 minutos
                </p>
              </div>
            )}
          </div>

          {/* Microphone Live Recording Option */}
          <div className="p-3 rounded-xl bg-[#0e1627] border border-gray-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-gray-500"}`}></span>
              <span className="text-gray-300">
                {isConverting
                  ? "Convirtiendo la grabación a WAV..."
                  : isRecording
                    ? `Grabando micrófono: ${recordingSeconds}s`
                    : "O graba nota de voz en directo. Se envía como WAV."}
              </span>
            </div>
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isConverting}
                className="px-3 py-1.5 rounded-lg bg-[#18233e] hover:bg-[#202e52] text-cyan-400 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">mic</span>
                Grabar
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">stop</span>
                Detener
              </button>
            )}
          </div>

          {/* Workspace category selection */}
          <div className="w-full bg-[#0d1424] border border-gray-800 rounded-lg px-3 py-2 text-xs text-cyan-400 font-medium">
            {currentUser?.role === "admin" && engineStatus
              ? `${engineStatus.execution_mode === "api" ? "API remota" : "Whisper en el servidor"} · ${engineStatus.active_model || "sin modelo"}`
              : "La transcripción empieza al confirmar y puedes seguir el avance en el espacio de trabajo."}
          </div>

          {/* Processing progress bar */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-[#080e1e] border border-cyan-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  {statusMessage}
                </span>
                <span className="font-mono text-white font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedFile || isProcessing || isConverting || isRecording}
            onClick={handleStartTranscription}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm font-bold">play_arrow</span>
            Comenzar Transcripción
          </button>
        </div>
      </div>
    </div>
  );
};
