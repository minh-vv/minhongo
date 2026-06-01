import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import aiTutorApi from '../api/aiTutorApi';

export default function AiChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      parts: 'Konnichiwa! Mình là Minhongo Sensei đây. Mình có thể giúp gì cho bạn hôm nay? Bạn muốn luyện chat tiếng Nhật, hay có câu hỏi gì về từ vựng, ngữ pháp không?',
      isIntro: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const newUserMsg = { role: 'user', parts: inputValue.trim() };
    const currentHistory = [...messages.filter(m => !m.isIntro)];
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send chat request
      const response = await aiTutorApi.chat({
        history: currentHistory.map(m => ({ role: m.role, parts: m.parts })),
        message: newUserMsg.parts
      });

      setMessages(prev => [...prev, { role: 'model', parts: response.reply }]);
    } catch (error) {
      console.error("Lỗi khi chat với AI:", error);
      setMessages(prev => [
        ...prev, 
        { role: 'model', parts: 'Gomen nasai (Xin lỗi), hiện tại hệ thống đang quá tải hoặc có lỗi xảy ra. Bạn thử lại sau nhé! 🙏' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-white p-4 rounded-t-xl shadow-sm border-b flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Luyện Chat cùng Sensei <Sparkles className="text-yellow-400" size={18} />
            </h1>
            <p className="text-sm text-gray-500">AI Tutor hỗ trợ sửa lỗi ngữ pháp & giao tiếp thực tế</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <BookOpen size={12} /> Sửa lỗi tự động
          </span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <Bot size={12} /> Gemini 2.5
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message Bubble */}
            <div className={`p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.parts}</p>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800">
                  <ReactMarkdown>{msg.parts}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-indigo-500" size={18} />
              <span className="text-gray-500 text-sm">Sensei đang gõ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 rounded-b-xl shadow-sm border-t">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all"
        >
          <button 
            type="button"
            className="p-3 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
            title="Sắp ra mắt tính năng thu âm"
          >
            <Mic size={20} />
          </button>
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Nhập tin nhắn bằng tiếng Nhật hoặc tiếng Việt (Shift + Enter để xuống dòng)..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 text-gray-700"
            rows="1"
            style={{ height: 'auto' }}
          />

          <button 
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-lg shrink-0 transition-colors ${
              inputValue.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} className={inputValue.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5' : ''} />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-3">
          AI có thể mắc lỗi. Vui lòng kiểm tra lại những thông tin quan trọng.
        </p>
      </div>
    </div>
  );
}
