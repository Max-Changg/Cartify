import { Mic, Volume2, Bot, User, Pause } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { MicrophoneState, ConversationMessage } from '../types';

interface VoicePanelProps {
  micState: MicrophoneState;
  onMicClick: () => void;
  conversationMessages: ConversationMessage[];
  isConversationActive: boolean;
}

export function VoicePanel({
  micState,
  onMicClick,
  conversationMessages,
  isConversationActive,
}: VoicePanelProps) {
  // Determine if user is speaking (listening state)
  const isUserSpeaking = micState === 'listening';
  // Determine if AI is speaking (processing state)
  const isAISpeaking = micState === 'processing';
  // Determine if paused
  const isPaused = micState === 'paused';
  // Determine if idle
  const isIdle = micState === 'idle';
  
  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  return (
    <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/20 border border-emerald-400/30 p-6 h-[calc(100vh-120px)] flex flex-col animate-gradient relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
      {/* Top Section - Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30">
            <Bot className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white drop-shadow-md">Grocery Assistant</h2>
            <p className="text-sm text-white/95 font-light drop-shadow-sm">Ask me what you need</p>
          </div>
        </div>
      </div>

      {/* Center - Conversation Area (Scrollable) */}
      <div className="flex-1 min-h-0 mb-4 overflow-hidden flex flex-col">
        {!isConversationActive && conversationMessages.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <Bot className="w-12 h-12 text-white/80" />
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Start a conversation</p>
            <p className="text-white/70 text-sm">Press the mic to begin</p>
          </div>
        ) : (
          // Conversation Messages - Scrollable container
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0"
          >
            {conversationMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  message.speaker === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
                style={{
                  animation: message.speaker === 'user' 
                    ? 'slide-in-right 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards'
                    : 'slide-in-left-message 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards',
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                }}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.speaker === 'user'
                      ? 'bg-white/20'
                      : 'bg-white/20'
                  }`}
                >
                  {message.speaker === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 transition-all duration-300 ${
                    message.speaker === 'user'
                      ? 'bg-white/90 text-gray-900'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator when AI is speaking */}
            {isAISpeaking && (
              <div className="flex gap-2 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/20 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom - Microphone Button (Fixed) */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Radar Pulses - Light grey transparent, only when idle */}
          {isIdle && (
            <>
              <div 
                className="absolute inset-0 rounded-full border border-gray-400/30 animate-radar-pulse pointer-events-none"
                style={{
                  boxShadow: '0 0 6px rgba(156, 163, 175, 0.15)',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full border border-gray-400/25 animate-radar-pulse pointer-events-none"
                style={{
                  animationDelay: '1s',
                  boxShadow: '0 0 6px rgba(156, 163, 175, 0.12)',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full border border-gray-400/20 animate-radar-pulse pointer-events-none"
                style={{
                  animationDelay: '2s',
                  boxShadow: '0 0 6px rgba(156, 163, 175, 0.08)',
                }}
              />
            </>
          )}
          
          <button
            onClick={onMicClick}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 z-10 button-shine-effect ${
              isIdle
                ? 'bg-white hover:bg-gray-50 cursor-pointer shadow-2xl hover:scale-105'
                : isPaused
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 cursor-pointer shadow-2xl shadow-yellow-500/50'
                : isUserSpeaking
                ? 'bg-gradient-to-br from-red-500 to-rose-600 cursor-pointer shadow-2xl shadow-red-500/50 animate-pulse-scale'
                : isAISpeaking
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 cursor-pointer shadow-2xl shadow-blue-500/50 animate-pulse-scale'
                : 'bg-white hover:bg-gray-50 cursor-pointer shadow-2xl'
            }`}
          >
            {/* Icon */}
            {isIdle && <Mic className="w-10 h-10 text-emerald-600 drop-shadow-sm" />}
            {isPaused && <Pause className="w-10 h-10 text-white drop-shadow-lg" />}
            {isUserSpeaking && <Mic className="w-10 h-10 text-white drop-shadow-lg" />}
            {isAISpeaking && <Volume2 className="w-10 h-10 text-white drop-shadow-lg" />}
          </button>
        </div>

        {/* Wave Bars Animation - Fixed height to prevent layout shift */}
        <div className="h-8 mt-3 flex items-end justify-center">
          {(isUserSpeaking || isAISpeaking) && (
            <div className="flex items-end justify-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-white rounded-full animate-wave-bar"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: `${10 + Math.random() * 20}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text Below Button - Fixed height to prevent layout shift */}
        <div className="mt-4 h-5 flex items-center justify-center">
          <p className="text-white/90 text-sm font-medium">
            {isIdle && 'Press to talk'}
            {isPaused && 'Microphone muted - Click to unmute'}
            {isUserSpeaking && 'Recording...'}
            {isAISpeaking && 'AI Speaking...'}
            {isConversationActive && !isPaused && !isUserSpeaking && !isAISpeaking && micState !== 'idle' && 'Listening...'}
          </p>
        </div>
        
        {/* Pause/Resume hint - Fixed height to prevent layout shift */}
        <div className="h-4 mt-1 flex items-center justify-center">
          {isConversationActive && !isPaused && (
            <p className="text-white/60 text-xs">
              Click mic to mute
            </p>
          )}
          {isPaused && (
            <p className="text-white/60 text-xs">
              Click mic to unmute
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
