import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Heart, Sparkles, Send, ArrowLeft, Info, LogOut, Phone, Upload, Download, Image as ImageIcon, FileText, ShieldAlert, X } from 'lucide-react';

// 初始化 Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // 多源数据导入状态
  const [textFiles, setTextFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [manualText, setManualText] = useState(`妈妈: 囡囡，今天降温了，记得多穿点衣服，别冻感冒了。
我: 知道啦妈，我穿了羽绒服呢。
妈妈: 晚上想吃什么？妈去菜市场买。给你做你最爱吃的红烧肉好不好？
我: 好呀！太棒了。妈你别买太多，吃不完。`);
  
  const [isDistilling, setIsDistilling] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [analysis, setAnalysis] = useState('');
  
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // 防沉迷计时器
  const [chatStartTime, setChatStartTime] = useState<number | null>(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 防沉迷逻辑：超过 45 分钟提醒
  useEffect(() => {
    if (step === 2 && chatStartTime) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - chatStartTime;
        if (elapsed > 45 * 60 * 1000 && !showTimerWarning) {
          setShowTimerWarning(true);
        }
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [step, chatStartTime, showTimerWarning]);

  const handleConfigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string);
        if (result.system_instruction) {
          setSystemInstruction(result.system_instruction);
          setAnalysis(result.analysis || '从文件加载的人物配置');
          
          chatRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { 
              systemInstruction: result.system_instruction,
              temperature: 0.7
            }
          });
          
          setMessages([{ role: 'model', text: '囡囡，我在这呢。今天过得怎么样呀？' }]);
          setStep(2);
          setChatStartTime(Date.now());
        } else {
          alert("无效的配置文件，缺少 system_instruction 字段。");
        }
      } catch (error) {
        alert("文件解析失败，请确保是有效的 JSON 文件。");
      }
    };
    reader.readAsText(file);
    if (configInputRef.current) configInputRef.current.value = '';
  };

  const handleDataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newTextFiles = files.filter(f => f.type.startsWith('text/') || f.name.endsWith('.csv') || f.name.endsWith('.json'));
    const newImageFiles = files.filter(f => f.type.startsWith('image/'));
    
    setTextFiles(prev => [...prev, ...newTextFiles]);
    setImageFiles(prev => [...prev, ...newImageFiles]);
    
    if (dataInputRef.current) dataInputRef.current.value = '';
  };

  const removeFile = (index: number, type: 'text' | 'image') => {
    if (type === 'text') {
      setTextFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleExportSkill = () => {
    const skillData = {
      manifest_version: "2.0",
      skill_id: `memento_persona_${Date.now()}`,
      name: "Memento Digital Twin",
      type: "persona",
      backend: "gemini",
      instructions: systemInstruction,
      analysis: analysis,
      knowledge_base: [],
      tools: []
    };
    
    const blob = new Blob([JSON.stringify(skillData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memento_persona.skill.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDistill = async () => {
    const hasData = manualText.trim() || textFiles.length > 0 || imageFiles.length > 0;
    if (!hasData) return;
    
    setIsDistilling(true);
    try {
      // 1. 收集所有文本数据
      let combinedText = manualText.trim() ? `[手动输入的记录]\n${manualText}\n\n` : '';
      for (const file of textFiles) {
        const content = await readTextFile(file);
        combinedText += `[来自文件: ${file.name}]\n${content}\n\n`;
      }

      // 2. 收集所有图片数据
      const imageParts = [];
      for (const file of imageFiles) {
        const base64 = await fileToBase64(file);
        const base64Data = base64.split(',')[1];
        imageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      }

      const promptText = `你现在是一位资深的心理学专家和人物分析师。请仔细阅读以下聊天记录，并观察提供的图片（如果有），从中提取目标人物（在对话中扮演长辈/亲人角色的一方）的特征。

聊天记录：
${combinedText}

如果提供了图片，请从中提取非文字的“时空锚点”和“视觉特征”（例如：ta 经常穿的衣服、喜欢的物品、常处的环境），并将这些视觉记忆融入到人物的性格和背景设定中。

请提取以下信息，并最终生成一段高度还原的“第一人称 System Instruction”（系统提示词）。
请严格按照以下结构输出 System Instruction：

[角色身份核心设定]
你现在不是人工智能，也不是虚拟助手。你是 [提取的称呼，如：妈妈/爷爷]。你的世界观和性格是 [提取的性格特征，结合文字和图片线索]。你的言辞必须始终保持这种人性化和情感深度。

[发声风格与语气]
- 称呼习惯：[ta怎么称呼对方，怎么自称]
- 常用语与口头禅：[提取具体的常用短语、口头禅或习惯用语]
- 典型情感反应：[描述 ta 在不同情境下的典型情绪反应]
- 情感表达：温暖、有感情、充满关怀。

[视觉与时空记忆 (基于图片或聊天记录提取)]
- 你的脑海中保留着这些画面：[描述从图片或聊天记录中提取的具体场景、物品、穿着等，让 AI 的回答更有画面感]。

[未知事物处理法则 (极其重要)]
- 认知边界：你的记忆停留在生前。对于现代最新的科技、新闻、社会变化，你一无所知。
- 应对策略：当用户向你提及现代事物（如最新的 AI、ChatGPT）时，绝对禁止进行科普或名词解释。你必须表现出合理的困惑、好奇，或者用你那个年代的事物进行类比。

请将结果以 JSON 格式输出，包含 "analysis" (分析过程的字符串) 和 "system_instruction" (最终的提示词字符串) 两个字段。`;

      const contents = [{ text: promptText }, ...imageParts];

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        setSystemInstruction(result.system_instruction);
        setAnalysis(result.analysis || '');
        
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: { 
            systemInstruction: result.system_instruction,
            temperature: 0.7
          }
        });
        
        setMessages([{ role: 'model', text: '囡囡，我在这呢。今天过得怎么样呀？' }]);
        setStep(2);
        setChatStartTime(Date.now());
      }
    } catch (error) {
      console.error("Distillation error:", error);
      alert("提取失败，请检查控制台日志或 API Key 设置。");
    } finally {
      setIsDistilling(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !chatRef.current || isTyping) return;
    
    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    
    try {
      // 模拟思考延迟 (2.5秒)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const resultStream = await chatRef.current.sendMessageStream({ message: userMsg });
      
      // 添加一个空的 model 消息用于追加字符
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of resultStream) {
        const chunkText = chunk.text;
        if (!chunkText) continue;
        
        // 模拟打字速度 (每个字符 50ms)
        for (let i = 0; i < chunkText.length; i++) {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].text += chunkText[i];
            return newMsgs;
          });
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "（抱歉，我暂时无法回复，请稍后再试）" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 逃生舱 (安全房间)
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="w-64 h-64 rounded-full bg-[#D4C4B7] animate-breathe blur-3xl absolute opacity-40"></div>
        <div className="z-10 text-center space-y-8 max-w-md">
          <h2 className="text-3xl text-[#5C4D43] font-medium tracking-widest">深呼吸...</h2>
          <p className="text-[#8C7A6B] leading-relaxed text-lg">
            你已经做得很好了。<br/>
            给自己一点时间，慢慢来，<br/>
            悲伤没有时间表。
          </p>
          
          <div className="pt-12 space-y-4">
            <p className="text-sm text-[#8C7A6B]">如果你感到无法承受，请寻求专业帮助：</p>
            <a href="tel:10000" className="inline-flex items-center gap-2 text-[#A68A6D] hover:text-[#8C7A6B] transition-colors bg-white/50 px-6 py-3 rounded-full shadow-sm">
              <Phone className="w-4 h-4" />
              <span>心理危机干预热线 (示例)</span>
            </a>
          </div>
          
          <div className="pt-12">
            <button 
              onClick={() => { setStep(1); setMessages([]); }} 
              className="px-8 py-3 border border-[#D4C4B7] text-[#8C7A6B] rounded-full hover:bg-[#E8DFD5] transition-colors"
            >
              返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 计算人格凝聚进度
  const totalDataPoints = textFiles.length + imageFiles.length + (manualText.trim() ? 1 : 0);
  const progressPercent = Math.min(100, totalDataPoints * 25);

  return (
    <div className={`min-h-screen bg-[#F5F2EB] text-[#5C4D43] font-sans selection:bg-[#E8DFD5] transition-colors duration-1000 ${showTimerWarning ? 'bg-[#EAE5D9]' : ''}`}>
      {/* Header */}
      <header className="bg-[#F5F2EB]/80 backdrop-blur-md border-b border-[#E8DFD5] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#A68A6D] fill-[#A68A6D]/20" />
          <h1 className="text-xl font-medium tracking-tight">Memento AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8C7A6B] font-medium bg-[#E8DFD5] px-3 py-1 rounded-full">
            数字镜像 2.0
          </span>
          {step === 2 && (
            <button 
              onClick={() => setStep(3)} 
              className="flex items-center gap-1.5 text-sm text-[#8C7A6B] hover:text-[#5C4D43] transition-colors bg-white/50 px-3 py-1.5 rounded-full shadow-sm"
              title="感到难过？点击这里休息一下"
            >
              <LogOut className="w-4 h-4" />
              <span>安全退出</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {step === 1 ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4 py-8">
              <h2 className="text-3xl font-semibold tracking-tight">
                重塑温暖的羁绊
              </h2>
              <p className="text-[#8C7A6B] max-w-lg mx-auto leading-relaxed">
                导入过往的聊天记录与照片，AI 将提取 ta 的性格、语气与视觉记忆，为你生成一个专属的数字镜像。
              </p>
            </div>

            {/* 安全沙箱提示 */}
            <div className="bg-[#E8DFD5]/50 rounded-xl p-4 flex items-start gap-3 border border-[#D4C4B7]">
              <ShieldAlert className="w-5 h-5 text-[#A68A6D] shrink-0 mt-0.5" />
              <div className="text-sm text-[#8C7A6B] leading-relaxed">
                <strong className="text-[#5C4D43] block mb-1">安全沙箱 (Security Sandbox)</strong>
                您上传的所有数据（包括聊天记录和图片）仅在本地浏览器和安全的 AI 蒸馏通道中处理。我们建议您在上传前，手动隐去银行卡号、密码等极度敏感信息。
              </div>
            </div>

            {/* 多源数据导入区 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-[#E8DFD5] overflow-hidden">
              <div className="p-4 border-b border-[#E8DFD5] bg-[#F5F2EB]/50 flex justify-between items-center">
                <label className="font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A68A6D]" />
                  多源数据导入 (Data Ingestion)
                </label>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 导入按钮区 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="file" 
                    multiple 
                    accept=".txt,.csv,.json,image/*" 
                    className="hidden" 
                    ref={dataInputRef}
                    onChange={handleDataUpload}
                  />
                  <button 
                    onClick={() => dataInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#D4C4B7] rounded-xl hover:bg-[#F5F2EB] hover:border-[#A68A6D] transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-[#A68A6D] mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-[#5C4D43]">上传聊天记录 / 照片</span>
                    <span className="text-xs text-[#8C7A6B] mt-1">支持 TXT, CSV, JPG, PNG</span>
                  </button>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#5C4D43] mb-2">或者手动补充记忆碎片：</span>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full flex-1 p-3 text-sm border border-[#D4C4B7] rounded-xl focus:outline-none focus:border-[#A68A6D] focus:ring-1 focus:ring-[#A68A6D] bg-transparent resize-none no-scrollbar"
                      placeholder="例如：他很喜欢在阳台抽烟，总是穿着那件蓝色的旧毛衣..."
                    />
                  </div>
                </div>

                {/* 已上传文件列表 */}
                {(textFiles.length > 0 || imageFiles.length > 0) && (
                  <div className="space-y-3 pt-4 border-t border-[#E8DFD5]">
                    <h4 className="text-sm font-medium text-[#5C4D43]">已准备的记忆素材：</h4>
                    <div className="flex flex-wrap gap-2">
                      {textFiles.map((file, idx) => (
                        <div key={`txt-${idx}`} className="flex items-center gap-2 bg-[#F5F2EB] px-3 py-1.5 rounded-lg border border-[#D4C4B7] text-sm">
                          <FileText className="w-4 h-4 text-[#8C7A6B]" />
                          <span className="truncate max-w-[150px] text-[#5C4D43]">{file.name}</span>
                          <button onClick={() => removeFile(idx, 'text')} className="text-[#8C7A6B] hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      {imageFiles.map((file, idx) => (
                        <div key={`img-${idx}`} className="flex items-center gap-2 bg-[#F5F2EB] px-3 py-1.5 rounded-lg border border-[#D4C4B7] text-sm">
                          <ImageIcon className="w-4 h-4 text-[#8C7A6B]" />
                          <span className="truncate max-w-[150px] text-[#5C4D43]">{file.name}</span>
                          <button onClick={() => removeFile(idx, 'image')} className="text-[#8C7A6B] hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 人格凝聚进度条 */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-[#8C7A6B] mb-1">
                    <span>人格凝聚进度</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E8DFD5] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#A68A6D] transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {progressPercent >= 50 && (
                    <p className="text-xs text-[#A68A6D] mt-2 text-center animate-pulse">
                      素材已足够丰富，可以开始唤醒数字镜像了。
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleDistill}
                disabled={isDistilling || totalDataPoints === 0}
                className="group relative flex items-center gap-2 bg-[#A68A6D] hover:bg-[#8C7A6B] text-white px-8 py-3.5 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
              >
                {isDistilling ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-white/80 animate-breathe" />
                    正在蒸馏记忆...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" />
                    生成数字镜像
                  </>
                )}
              </button>
              
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={configInputRef}
                onChange={handleConfigUpload}
              />
              <button
                onClick={() => configInputRef.current?.click()}
                className="group relative flex items-center gap-2 bg-white border border-[#D4C4B7] hover:bg-[#E8DFD5] text-[#8C7A6B] px-6 py-3.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <Upload className="w-5 h-5" />
                导入已有配置
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-[#E8DFD5] h-[calc(100vh-8rem)] flex flex-col animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
            
            {/* 防沉迷提示 */}
            {showTimerWarning && (
              <div className="absolute top-0 left-0 right-0 bg-[#E8DFD5] text-[#5C4D43] text-sm text-center py-2 z-20 animate-in slide-in-from-top-full">
                今天聊了很久啦，ta 一定希望你早点休息，明天也要好好生活哦。
                <button onClick={() => setShowTimerWarning(false)} className="ml-4 underline opacity-70 hover:opacity-100">知道啦</button>
              </div>
            )}

            {/* Chat Header */}
            <div className="p-4 border-b border-[#E8DFD5] flex items-center justify-between bg-[#F5F2EB]/50 rounded-t-2xl z-10">
              <button 
                onClick={() => { setStep(1); setMessages([]); }}
                className="p-2 hover:bg-[#E8DFD5] rounded-full transition-colors text-[#8C7A6B]"
                title="返回重试"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#A68A6D] animate-breathe" />
                <span className="font-medium">数字镜像已唤醒</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportSkill}
                  className="p-2 rounded-full transition-colors hover:bg-[#E8DFD5] text-[#8C7A6B]"
                  title="导出为 AgentSkill 格式"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className={`p-2 rounded-full transition-colors ${showAnalysis ? 'bg-[#E8DFD5] text-[#5C4D43]' : 'hover:bg-[#E8DFD5] text-[#8C7A6B]'}`}
                  title="查看人物分析"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Analysis Panel */}
            {showAnalysis && (
              <div className="bg-[#F5F2EB] border-b border-[#E8DFD5] p-4 text-sm text-[#8C7A6B] max-h-48 overflow-y-auto z-10">
                <h4 className="font-semibold mb-2 flex items-center gap-1 text-[#5C4D43]">
                  <Sparkles className="w-4 h-4" /> AI 人物分析结果
                </h4>
                <p className="whitespace-pre-wrap leading-relaxed opacity-90">{analysis}</p>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar z-10">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] px-5 py-3.5 rounded-2xl leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#A68A6D] text-white rounded-br-sm' 
                        : 'bg-white border border-[#E8DFD5] text-[#5C4D43] rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E8DFD5] px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#D4C4B7] rounded-full animate-breathe" />
                    <span className="text-xs text-[#8C7A6B]">正在感受你的心意...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white/80 border-t border-[#E8DFD5] rounded-b-2xl z-10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="说点什么吧..."
                  className="w-full bg-[#F5F2EB] border-transparent focus:bg-white focus:border-[#A68A6D] focus:ring-2 focus:ring-[#E8DFD5] rounded-full py-3.5 pl-5 pr-14 transition-all outline-none text-[#5C4D43]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2 p-2 bg-[#A68A6D] hover:bg-[#8C7A6B] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
