import React from "react";
import { MessageSquare, Send, RefreshCw, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BursaStockReportResponse, FinancialFiling, ChatMessage } from "../../types/terminal";

const SUGGESTED_QUESTIONS = [
  { label: "Revenue Drivers", prompt: "What are the primary revenue drivers and segment performance in the latest report?" },
  { label: "Management Outlook", prompt: "Summarize the Board's business outlook and expected capital expenditures." },
  { label: "Quarterly Variance", prompt: "Explain the pre-tax profit variance between the current and preceding quarter." },
  { label: "Debt & Cash Position", prompt: "What are the company's total borrowings, gearing ratio, and cash reserves?" },
  { label: "Valuation Sensitivity", prompt: "What are the fair value estimates and valuation sensitivity assumptions?" },
];

interface BottomCopilotTerminalProps {
  data: BursaStockReportResponse;
  selectedFiling: FinancialFiling | null;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatLoading: boolean;
  highlightCopilot: boolean;
  onInputChange: (val: string) => void;
  onSendMessage: (textToSend?: string) => void;
  onClearTranscript: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
}

export function BottomCopilotTerminal({
  data,
  selectedFiling,
  chatMessages,
  chatInput,
  chatLoading,
  highlightCopilot,
  onInputChange,
  onSendMessage,
  onClearTranscript,
  containerRef,
  inputRef,
  chatBottomRef,
}: BottomCopilotTerminalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white dark:bg-[#121417] border ${
        highlightCopilot
          ? "border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10"
          : "border-slate-200 dark:border-[#1F2328]"
      } rounded-xl transition-all duration-300 shadow-xs flex flex-col`}
    >
      {/* Copilot Terminal Header */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#16191D] border-b border-slate-200 dark:border-[#1F2328] flex flex-col sm:flex-row sm:items-center justify-between rounded-t-xl gap-2 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                AI Financial Research Copilot Terminal
              </h3>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Bursa RAG Grounded</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#8B949E]">
              Context: <strong className="text-slate-800 dark:text-slate-200">{data.stock.name} ({data.stock.ticker})</strong> • {selectedFiling ? selectedFiling.period : "Latest Disclosures"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={onClearTranscript}
            className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-[#8B949E] hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1F2328] border border-transparent hover:border-slate-200 dark:hover:border-[#30363D] transition active:scale-95"
            title="Clear transcript & reset memory for this stock"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Transcript</span>
          </button>
        </div>
      </div>

      {/* Suggested Analytical Prompt Pills (Horizontally Scrollable) */}
      <div className="px-3.5 py-2.5 bg-slate-50/60 dark:bg-[#121417] border-b border-slate-200 dark:border-[#1F2328] flex items-center space-x-2 overflow-x-auto text-xs whitespace-nowrap shrink-0">
        <span className="text-[11px] text-slate-500 dark:text-[#8B949E] font-medium shrink-0">Quick Prompts:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(q.prompt)}
            disabled={chatLoading}
            className="bg-white dark:bg-[#16191D] hover:bg-slate-100 dark:hover:bg-[#1F2328] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1F2328] transition shrink-0 disabled:opacity-40 active:scale-95 shadow-2xs"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Conversation Transcript Window */}
      <div className="h-72 sm:h-80 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            
            <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500 dark:text-[#8B949E]">
              <span>{msg.role === "user" ? "You" : "Analyst Copilot"}</span>
              {msg.time && <span>• {msg.time}</span>}
            </div>

            <div className={`p-4 rounded-xl max-w-[88%] leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-tr-xs shadow-sm"
                : "bg-slate-100 dark:bg-[#16191D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1F2328] rounded-tl-xs shadow-2xs"
            }`}>
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose dark:prose-invert prose-xs max-w-none space-y-2 text-slate-800 dark:text-slate-200">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => <h3 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1F2328] pb-1 mt-1 mb-1" {...props} />,
                      h2: ({ ...props }) => <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 mb-0.5" {...props} />,
                      p: ({ ...props }) => <p className="mb-1.5 leading-relaxed text-xs text-slate-800 dark:text-slate-200" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc pl-4 space-y-0.5 mb-1 text-xs" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1 text-xs" {...props} />,
                      li: ({ ...props }) => <li className="text-slate-800 dark:text-slate-200" {...props} />,
                      strong: ({ ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                      blockquote: ({ ...props }) => (
                        <blockquote className="border-l-2 border-blue-500 pl-2.5 py-1 my-1.5 bg-slate-200/50 dark:bg-[#121417] text-slate-600 dark:text-[#8B949E] italic text-[11px] rounded-r" {...props} />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex flex-col items-start">
            <div className="text-[10px] text-slate-500 dark:text-[#8B949E] mb-1">Analyst Copilot is reviewing disclosures...</div>
            <div className="bg-slate-100 dark:bg-[#16191D] border border-slate-200 dark:border-[#1F2328] rounded-xl rounded-tl-xs p-3.5 flex items-center space-x-2 text-slate-700 dark:text-slate-300 shadow-2xs">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">Reviewing quarterly disclosures & notes...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Terminal Input Dock */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#121417] border-t border-slate-200 dark:border-[#1F2328] rounded-b-xl shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Ask Copilot about ${data.stock.name} revenue, borrowing profile, dividend sustainability, or guidance...`}
            className="flex-1 bg-white dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6E7681] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition disabled:opacity-40 active:scale-95 shadow-xs font-semibold text-xs flex items-center space-x-1.5"
            title="Send message"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#8B949E] mt-2 px-1">
          <span>Multi-turn conversational reasoning grounded in Bursa Malaysia regulatory reports</span>
          <span className="hidden sm:inline font-mono">Persistence: Local Encrypted Transcript</span>
        </div>
      </div>
    </div>
  );
}
