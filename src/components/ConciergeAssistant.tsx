import {
  Bot,
  Loader2,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FLEET_VEHICLES } from '../data/heritageData';
import type { ChatMessage, InquiryDraft } from '../types/travel';

interface ConciergeAssistantProps {
  isOpen: boolean;
  initialTab?: 'chat' | 'voice';
  draft: InquiryDraft;
  onClose: () => void;
}

type ConciergeTab = 'chat' | 'voice';
type ChatModelMode = 'standard' | 'fast';

interface VoiceTranscriptEntry {
  id: string;
  speaker: 'You' | 'Concierge';
  text: string;
}

const STARTER_PROMPTS = [
  'Which car suits 6 passengers for a Madurai Airport pickup?',
  'Plan a Rameswaram temple road trip from Srivilliputtur',
  'How do I confirm an outstation cab fare with Sri Arumuga Travels?',
  'Do you drive from Srivilliputtur to Chennai or Bengaluru?',
];

function pcmFloat32ToBase64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64PcmToAudioBuffer(
  ctx: AudioContext,
  base64: string
): AudioBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  const buffer = ctx.createBuffer(1, float32.length, 24000);
  buffer.getChannelData(0).set(float32);
  return buffer;
}

export function ConciergeAssistant({
  isOpen,
  initialTab = 'chat',
  draft,
  onClose,
}: ConciergeAssistantProps) {
  const [activeTab, setActiveTab] = useState<ConciergeTab>(initialTab);
  const [modelMode, setModelMode] = useState<ChatModelMode>('standard');

  // Multi-turn Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Vanakkam! Welcome to Sri Arumuga Travels in Srivilliputtur. Ask me about our Toyota Etios GD (TN 84 F 6278), Toyota Innova, Hyundai Verna, or Hyundai Grand i10 — or plan Madurai Airport pickups, temple routes, and outstation rides across India.',
      modelLabel: 'gemini-4-hydrogen',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Live Voice State (gemini-3.8-live)
  const [voiceStatus, setVoiceStatus] = useState<
    'idle' | 'connecting' | 'live' | 'error'
  >('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<VoiceTranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const stopVoiceSession = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // Ignore already stopped sources
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      void inputCtxRef.current.close();
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      void outputCtxRef.current.close();
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setVoiceStatus('idle');
    setIsMuted(false);
  };

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  const sendChatMessage = async (textOverride?: string) => {
    const promptText = (textOverride ?? chatInput).trim();
    if (!promptText || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText,
    };
    const assistantMsgId = `model-${Date.now() + 1}`;
    const chosenModelLabel =
      modelMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

    const priorHistory = messages
      .filter((m) => m.id !== 'welcome-1')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: 'model', text: '', modelLabel: chosenModelLabel },
    ]);
    if (!textOverride) setChatInput('');
    setChatError(null);
    setIsStreaming(true);

    const activeVehicle =
      FLEET_VEHICLES.find((v) => v.id === draft.vehicleId) ?? FLEET_VEHICLES[0];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: priorHistory,
          modelMode,
          tripContext: {
            pickupLocation: draft.pickupLocation,
            dropDestination: draft.dropDestination,
            vehicleName: activeVehicle.name,
            tripType: draft.tripType,
            distanceKm: draft.distanceKm,
            days: draft.days,
          },
        }),
      });

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Concierge request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payloadRaw = trimmed.slice(5).trim();
          if (!payloadRaw) continue;
          const payload = JSON.parse(payloadRaw) as {
            text?: string;
            error?: string;
            done?: boolean;
          };

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (payload.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, text: m.text + payload.text } : m
              )
            );
          }
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to connect to Gemini concierge.';
      setChatError(msg);
      setMessages((prev) =>
        prev.filter((m) => !(m.id === assistantMsgId && m.text.length === 0))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const startVoiceSession = async () => {
    if (voiceStatus === 'live' || voiceStatus === 'connecting') return;
    setVoiceError(null);
    setVoiceStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live-voice`);
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (isMutedRef.current) return;
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const channelData = event.inputBuffer.getChannelData(0);
          const base64Audio = pcmFloat32ToBase64(channelData);
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string) as {
          ready?: boolean;
          audio?: string;
          inputTranscript?: string;
          outputTranscript?: string;
          interrupted?: boolean;
          error?: string;
        };

        if (msg.ready) {
          setVoiceStatus('live');
        }

        if (msg.error) {
          stopVoiceSession();
          setVoiceError(msg.error);
          setVoiceStatus('error');
          return;
        }

        if (msg.interrupted) {
          activeSourcesRef.current.forEach((src) => {
            try {
              src.stop();
            } catch {
              // Ignore
            }
          });
          activeSourcesRef.current = [];
          if (outputCtxRef.current) {
            nextStartTimeRef.current = outputCtxRef.current.currentTime;
          }
        }

        if (msg.audio && outputCtxRef.current) {
          const ctx = outputCtxRef.current;
          if (ctx.state === 'suspended') {
            void ctx.resume();
          }
          const audioBuffer = base64PcmToAudioBuffer(ctx, msg.audio);
          const sourceNode = ctx.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(ctx.destination);

          const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
          sourceNode.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
          activeSourcesRef.current.push(sourceNode);

          sourceNode.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter(
              (s) => s !== sourceNode
            );
          };
        }

        if (msg.inputTranscript) {
          const text = msg.inputTranscript.trim();
          if (text) {
            setTranscripts((prev) => [
              ...prev.slice(-14),
              { id: `in-${Date.now()}-${Math.random()}`, speaker: 'You', text },
            ]);
          }
        }

        if (msg.outputTranscript) {
          const text = msg.outputTranscript.trim();
          if (text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'Concierge') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: `${last.text} ${text}`.trim() },
                ];
              }
              return [
                ...prev.slice(-14),
                {
                  id: `out-${Date.now()}-${Math.random()}`,
                  speaker: 'Concierge',
                  text,
                },
              ];
            });
          }
        }
      };

      ws.onerror = () => {
        stopVoiceSession();
        setVoiceError('Live voice WebSocket connection failed.');
        setVoiceStatus('error');
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          stopVoiceSession();
        }
      };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Microphone permission is required for Live Voice.';
      stopVoiceSession();
      setVoiceError(msg);
      setVoiceStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Heritage Travel Concierge"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] max-h-[78vh] flex flex-col rounded-3xl glass-obsidian text-[#F6F1E8] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#B85C38]/25 border border-[#F3E0D6]/35 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#F3E0D6]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold leading-tight text-[#FFFDF9]">
              Sri Arumuga Concierge
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F3E0D6]">
              Srivilliputtur Travel Desk AI
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close concierge drawer"
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#E4DBCF] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher Tabs: Chat vs Live Voice */}
      <div className="px-5 pt-3 pb-2 border-b border-white/10">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-black/30 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-[#B85C38] text-white'
                : 'text-[#E4DBCF] hover:text-white'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Trip Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'voice'
                ? 'bg-[#1F8470] text-white'
                : 'text-[#E4DBCF] hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Live Voice (3.8)</span>
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Model Selector + Clear */}
          <div className="px-5 py-2 flex items-center justify-between gap-2 text-[11px] border-b border-white/10 bg-black/15">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setModelMode('standard')}
                className={`px-2.5 py-1 rounded-full font-mono transition-colors ${
                  modelMode === 'standard'
                    ? 'bg-white/15 text-[#FFDEAE] border border-[#D99B26]/40'
                    : 'text-[#E3DACB]/70 hover:text-white'
                }`}
              >
                gemini-4-hydrogen
              </button>
              <button
                type="button"
                onClick={() => setModelMode('fast')}
                className={`px-2.5 py-1 rounded-full font-mono transition-colors ${
                  modelMode === 'fast'
                    ? 'bg-white/15 text-[#FFDEAE] border border-[#D99B26]/40'
                    : 'text-[#E3DACB]/70 hover:text-white'
                }`}
              >
                flash-lite (Fast)
              </button>
            </div>

            {messages.length > 1 ? (
              <button
                type="button"
                onClick={() => setMessages((prev) => prev.slice(0, 1))}
                className="inline-flex items-center gap-1 text-[#E3DACB]/75 hover:text-white"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                <span>Clear</span>
              </button>
            ) : null}
          </div>

          {/* Scrollable Multi-Turn Message Thread */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 min-h-[240px] max-h-[360px]"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#B85C38] text-white rounded-br-sm'
                        : 'bg-white/10 border border-white/10 text-[#F6F1E8] rounded-bl-sm'
                    }`}
                  >
                    {msg.text || (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#E4DBCF]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        <span>Planning itinerary...</span>
                      </span>
                    )}
                  </div>
                  {!isUser && msg.modelLabel ? (
                    <span className="mt-1 font-mono text-[10px] text-[#E4DBCF]/55 flex items-center gap-1">
                      <Bot className="w-3 h-3" aria-hidden="true" />
                      <span>{msg.modelLabel}</span>
                    </span>
                  ) : null}
                </div>
              );
            })}

            {messages.length === 1 ? (
              <div className="pt-2 space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F3E0D6]">
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendChatMessage(prompt)}
                      className="text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 text-xs text-[#E4DBCF] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {chatError ? (
            <div className="mx-5 mb-2 px-3 py-2 rounded-xl bg-[#93000A]/70 border border-[#FFB598]/40 text-xs text-[#FFDAD6]">
              {chatError}
            </div>
          ) : null}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendChatMessage();
            }}
            className="p-4 border-t border-white/10 bg-black/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about cars, routes, or booking..."
              className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-sm text-[#FFFDF9] placeholder:text-[#E4DBCF]/55 focus:outline-none focus:border-[#B85C38]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isStreaming}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] disabled:opacity-45 text-white flex items-center justify-center shrink-0 transition-colors"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </>
      ) : (
        /* Real-Time Voice Desk (Gemini 3.8 Live API) */
        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between min-h-[340px]">
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/8 border border-white/12 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                    voiceStatus === 'live'
                      ? 'bg-[#1F8470]/25 border-[#1F8470]/60 text-[#6EE7B7]'
                      : 'bg-white/10 border-white/15 text-[#F3E0D6]'
                  }`}
                >
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#FFFDF9]">
                    {voiceStatus === 'live'
                      ? 'Voice Desk Connected'
                      : voiceStatus === 'connecting'
                      ? 'Connecting to Gemini 3.8 Live...'
                      : 'Real-Time Voice Concierge'}
                  </p>
                  <p className="font-mono text-[11px] text-[#E4DBCF]/75">
                    {voiceStatus === 'live'
                      ? isMuted
                        ? 'Microphone muted · Listening paused'
                        : '16kHz Mic -> 24kHz Zephyr Voice'
                      : 'Speak naturally about your Srivilliputtur trip'}
                  </p>
                </div>
              </div>
            </div>

            {voiceError ? (
              <div className="rounded-xl bg-[#93000A]/70 border border-[#FFB598]/40 p-3 text-xs text-[#FFDAD6]">
                {voiceError}
              </div>
            ) : null}

            {/* Live Transcript Feed */}
            <div className="rounded-2xl bg-black/25 border border-white/10 p-3.5 h-44 overflow-y-auto space-y-2.5 text-xs">
              {transcripts.length === 0 ? (
                <p className="text-[#E4DBCF]/60 text-center pt-12">
                  Tap &ldquo;Start Voice Call&rdquo; below to speak directly with our AI concierge
                  about routes, temple hours, and cab availability.
                </p>
              ) : (
                transcripts.map((entry) => (
                  <div key={entry.id} className="space-y-0.5">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.06em] ${
                        entry.speaker === 'You' ? 'text-[#F3E0D6]' : 'text-[#6EE7B7]'
                      }`}
                    >
                      {entry.speaker}
                    </span>
                    <p className="text-[#F6F1E8] leading-relaxed">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {voiceStatus === 'live' || voiceStatus === 'connecting' ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-white/12 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-4 h-4 text-[#FFB598]" aria-hidden="true" />
                      <span>Unmute Mic</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#F3E0D6]" aria-hidden="true" />
                      <span>Mute Mic</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={stopVoiceSession}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#B42318] hover:bg-[#93000A] text-white text-sm font-semibold transition-colors"
                >
                  <PhoneOff className="w-4 h-4" aria-hidden="true" />
                  <span>End Voice</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void startVoiceSession()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-sm font-semibold transition-colors"
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                <span>Start Voice Call (Gemini 3.8 Live)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
