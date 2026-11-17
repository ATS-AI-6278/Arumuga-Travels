import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  GenerateContentResponse,
  LiveServerMessage,
  Modality,
  ThinkingLevel,
} from '@google/genai';

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

const TRAVEL_DESK_SYSTEM_INSTRUCTION = `You are the Travel Desk Concierge for Sri Arumuga Travels, a Tamil Nadu outstation taxi and cab desk based in Srivilliputtur (Srivilliputhur), Tamil Nadu.
Your role is to help travelers plan outstation cab journeys across Tamil Nadu and India, Madurai Airport (IXM) pickups/drops, temple & pilgrimage trips, and local day trips with warmth, clarity, and plain answers.
Verified facts for Sri Arumuga Travels:
- Location: Keelapatti Street, Mariamman Kovil Street, Srivilliputtur, Tamil Nadu 626125 (GJ7P+3QH).
- Phone & WhatsApp: +91 98942 20028 (Primary Call & WhatsApp) and +91 86676 69560 (Call).
- Email: sriviarumugatravels@gmail.com.
- Fleet lineup:
  1) Toyota Etios GD (Plate: TN 84 F 6278, 4-seater diesel sedan, clean AC interior — dedicated car for outstation, Madurai airport & temple trips).
  2) Toyota Innova (7-seater diesel MPV for larger families & luggage).
  3) Hyundai Verna (4-seater petrol sedan).
  4) Hyundai Grand i10 (4-seater petrol hatchback for local & nearby town hops).
  Note: Sri Arumuga Travels does NOT operate tempo travellers or buses.
- Fares & Booking: We do not publish fixed rate cards online. Final fares are confirmed clearly upfront by phone call (+91 98942 20028 / +91 86676 69560) or WhatsApp based on pickup, destination, dates, and passenger/luggage requirements.
- Familiar destinations from Srivilliputtur: Madurai & IXM Airport (~78 km / 1h 45m), Courtallam (~68 km), Tirunelveli (~112 km), Kodaikanal (~195 km), Kanyakumari (~210 km), Rameswaram (~215 km), Coimbatore (~285 km), Bengaluru (~510 km), Chennai (~545 km), and anywhere in India by road.
Keep responses helpful, graceful, accurate, and concise.`;

function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/config', (_req, res) => {
    const mapsApiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({ mapsApiKey });
  });

  app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured. Please set it in the Settings > Secrets panel.',
      });
      return;
    }

    const { message, history = [], modelMode = 'standard', tripContext } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'model'; text: string }>;
      modelMode?: 'standard' | 'fast';
      tripContext?: {
        pickupLocation?: string;
        dropDestination?: string;
        vehicleName?: string;
        tripType?: string;
        distanceKm?: number;
        days?: number;
      };
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const modelName =
      modelMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

    const contextAppendix = tripContext
      ? `\n\nActive Traveler Desk Selection:\n- Pickup: ${tripContext.pickupLocation || 'Srivilliputtur'}\n- Drop: ${tripContext.dropDestination || 'Unspecified'}\n- Vehicle: ${tripContext.vehicleName || 'Sedan'}\n- Mode: ${tripContext.tripType || 'round-trip'} (${tripContext.days || 1} day(s), ~${tripContext.distanceKm || 78} km one-way)`
      : '';

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    try {
      const ai = createGeminiClient();
      const formattedHistory = history
        .filter((h) => h && (h.role === 'user' || h.role === 'model') && h.text)
        .map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }));

      const chat = ai.chats.create({
        model: modelName,
        history: formattedHistory,
        config: {
          systemInstruction: `${TRAVEL_DESK_SYSTEM_INSTRUCTION}${contextAppendix}`,
          ...(modelName === 'gemini-4-hydrogen'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      const stream = await chat.sendMessageStream({ message: message.trim() });
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          res.write(`data: ${JSON.stringify({ text: c.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true, model: modelName })}\n\n`);
      res.end();
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Unable to reach Gemini concierge service.';
      console.error('Gemini chat error:', err);
      res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
      res.end();
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // WebSocket Server for Gemini 3.8 Live API Real-Time Voice Conversations
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const urlPath = (request.url || '').split('?')[0];
    if (urlPath === '/api/live-voice') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          error:
            'GEMINI_API_KEY is missing. Please add it in Settings > Secrets to use Live Voice.',
        })
      );
      clientWs.close();
      return;
    }

    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let isClosed = false;

    try {
      const ai = createGeminiClient();
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `${TRAVEL_DESK_SYSTEM_INSTRUCTION}\nSpeak warmly, naturally, and concisely in voice conversation as a live Srivilliputtur travel desk concierge.`,
        },
        callbacks: {
          onopen: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ ready: true }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ inputTranscript: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ outputTranscript: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          },
          onerror: (err: unknown) => {
            console.error('Gemini Live API error:', err);
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  error:
                    err instanceof Error ? err.message : 'Live voice session encountered an error.',
                })
              );
            }
          },
          onclose: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ closed: true }));
              clientWs.close();
            }
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Gemini Live API.';
      console.error('Failed to initialize Gemini Live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: msg }));
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!liveSession || isClosed) return;
      try {
        const parsed = JSON.parse(raw.toString()) as { audio?: string; text?: string };
        if (parsed.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          liveSession.sendRealtimeInput({ text: parsed.text });
        }
      } catch (err) {
        console.error('Invalid client live message:', err);
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      try {
        liveSession?.close();
      } catch {
        // Session already closed
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sri Arumuga Travels server listening on http://localhost:${PORT}`);
  });
}

startServer();
