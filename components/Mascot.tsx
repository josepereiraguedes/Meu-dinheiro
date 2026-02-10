import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Bot, X, ShieldAlert, TrendingUp, Wallet, AlertTriangle, Lightbulb, Mic, Check, Loader2, Info, Volume2, VolumeX, Swords } from 'lucide-react';
import { clsx } from 'clsx';
import { TransactionType } from '../types';

// Type definition for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const Mascot: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    totalBalance, categories, budgets, getBudgetStatus, transactions, 
    addTransaction, addGoal, suggestCategoryAndAccount, accounts
  } = useFinance();
  
  const [isOpen, setIsOpen] = useState(true); 
  const [message, setMessage] = useState("");
  const [emotion, setEmotion] = useState<'normal' | 'happy' | 'alert' | 'thinking' | 'listening'>('normal');
  const [isBouncing, setIsBouncing] = useState(false);
  const [insightType, setInsightType] = useState<'tip' | 'warning' | 'success' | 'analysis' | 'voice' | 'quest'>('tip');

  // Settings
  const [isMuted, setIsMuted] = useState(false);
  const [dailyQuest, setDailyQuest] = useState("");
  
  // Controle de Repetição (Evita falar a quest toda hora)
  const [hasAnnouncedQuest, setHasAnnouncedQuest] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  
  // Controle de Saudação
  const [hasGreeted, setHasGreeted] = useState(false);

  const firstName = useMemo(() => user.name.split(' ')[0], [user.name]);

  // --- ENGINE DE VOZ (TTS) OTIMIZADA ---
  
  // 1. Carregar vozes do sistema assim que disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    
    // Chrome carrega vozes assincronamente
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (isMuted || !window.speechSynthesis) return;

    // Cancela falas anteriores
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurações para PT-BR Fluido
    utterance.lang = 'pt-BR';
    utterance.rate = 1.35; // Mais rápido e natural (Padrão costuma ser lento)
    utterance.pitch = 1.05; // Levemente mais agudo para parecer ativo, mas não robótico

    // Estratégia de Seleção de Melhor Voz
    if (availableVoices.length > 0) {
        // Filtra apenas PT-BR
        const ptVoices = availableVoices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
        
        // Tenta encontrar vozes de alta qualidade (Google, Microsoft, Apple)
        const bestVoice = 
            ptVoices.find(v => v.name.includes('Google')) || // Android/Chrome (Geralmente a melhor)
            ptVoices.find(v => v.name.includes('Luciana')) || // iOS
            ptVoices.find(v => v.name.includes('Microsoft')) || // Windows
            ptVoices[0]; // Fallback para a primeira PT-BR encontrada

        if (bestVoice) {
            utterance.voice = bestVoice;
        }
    }

    window.speechSynthesis.speak(utterance);
  }, [isMuted, availableVoices]);

  // --- PERSONALIDADE & QUESTS ---

  const generateDailyQuest = useCallback(() => {
    const quests = [
        "Missão Diária: Não peça delivery hoje!",
        "Quest: Adicione R$ 10,00 na sua meta de viagem.",
        "Desafio: Verifique se suas assinaturas estão em dia.",
        "Missão: Tente não gastar nada nas próximas 6 horas.",
        "Quest: Revise seus gastos da semana passada."
    ];
    // Usa a data para gerar um índice "pseudo-aleatório" fixo para o dia
    const dayIndex = new Date().getDate() % quests.length;
    return quests[dayIndex];
  }, []);

  useEffect(() => {
    setDailyQuest(generateDailyQuest());
  }, [generateDailyQuest]);


  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    
    const phrases = [
      `${timeGreeting}, ${firstName}! Pronto para farmar xp?`,
      `Olá, ${firstName}. Sistemas operacionais.`,
      `E aí, ${firstName}! Vamos dominar o mercado hoje?`,
      `${timeGreeting}, ${firstName}. Seu saldo aguarda.`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, [firstName]);

  const getSuccessPhrase = (amount: number, type: 'income' | 'expense') => {
    if (type === 'income') {
       const phrases = [
         `Boa! O saldo subiu.`,
         `Stonks! 📈 Mais R$ ${amount}.`,
         `Dinheiro na mão é alegria.`,
         `GG! Receita registrada.`
       ];
       return phrases[Math.floor(Math.random() * phrases.length)];
    } else {
       const phrases = [
         `Ok, anotei o gasto de R$ ${amount}.`,
         `Cuidado com o Boss Final (Fatura).`,
         `Menos ouro no inventário.`,
         `Entendido, ${firstName}.`
       ];
       return phrases[Math.floor(Math.random() * phrases.length)];
    }
  };

  // --- ENGINE DE INSIGHTS ---

  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = currentMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = currentMonthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return { income, expense, count: currentMonthTrans.length };
  }, [transactions]);

  const generateInsight = useCallback(() => {
    if (isListening) return;

    // Se acabou de entrar na app, dá oi
    if (!hasGreeted) {
        const greet = getGreeting();
        setMessage(greet);
        // Pequeno delay para garantir que as vozes carregaram
        setTimeout(() => speak(greet), 500); 
        setInsightType('tip');
        setEmotion('happy');
        setHasGreeted(true);
        return;
    }

    const insights: { text: string, type: 'warning' | 'success' | 'analysis' | 'tip' | 'quest', priority: number }[] = [];

    // NÍVEL 1: PRIORIDADE CRÍTICA (Sempre fala se houver problema)
    if (totalBalance < 0) {
      insights.push({ text: `ALERTA: Conta no vermelho! Pare os gastos.`, type: 'warning', priority: 100 });
    }

    budgets.forEach(b => {
      const status = getBudgetStatus(b.categoryId);
      const catName = categories.find(c => c.id === b.categoryId)?.name;
      if (status.percent >= 100) {
        insights.push({ text: `Game Over em ${catName}. Orçamento estourado!`, type: 'warning', priority: 95 });
      }
    });

    // NÍVEL 2: QUEST DIÁRIA (Só adiciona se ainda não foi falada nesta sessão)
    if (!hasAnnouncedQuest && Math.random() > 0.6) {
        insights.push({ text: dailyQuest, type: 'quest', priority: 50 });
    }

    // NÍVEL 3: DICAS (Baixa prioridade)
    const genericTips = [
      `Diga "Ir para Metas" para navegar.`,
      `Pergunte "Quanto gastei em mercado?".`,
      `Estou aqui, ${firstName}. É só chamar.`,
      `Dica: Use comandos curtos como "Gastei 10 padaria".`
    ];
    insights.push({ text: genericTips[Math.floor(Math.random() * genericTips.length)], type: 'tip', priority: 10 });

    const selected = insights.sort((a, b) => b.priority - a.priority)[0];
    
    if (!voiceText) {
        setMessage(selected.text);
        setInsightType(selected.type);
        
        // Marca a quest como anunciada para não repetir
        if (selected.type === 'quest') {
            setHasAnnouncedQuest(true);
        }

        // Só fala automaticamente se for algo importante ou uma Quest (que não foi dita ainda)
        if (selected.priority >= 50) {
            speak(selected.text);
        }

        if (selected.type === 'warning') setEmotion('alert');
        else if (selected.type === 'quest') setEmotion('thinking');
        else if (selected.type === 'success') setEmotion('happy');
        else setEmotion('normal');
    }

  }, [totalBalance, budgets, getBudgetStatus, dailyQuest, isListening, hasGreeted, firstName, voiceText, speak, hasAnnouncedQuest]);

  useEffect(() => {
    if (!isListening) {
        setIsOpen(true);
        generateInsight();
        const timer = setTimeout(() => {
             // Fecha automaticamente apenas se for uma dica comum, alertas ficam mais tempo
             if (insightType === 'tip') setIsOpen(false);
        }, 8000);
        return () => clearTimeout(timer);
    }
  }, [pathname]); 

  // --- PROCESSAMENTO DE VOZ ---

  const processVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    // --- FUNÇÃO AUXILIAR PARA RESPOSTA ---
    const respond = (txt: string, emo: typeof emotion, type: typeof insightType) => {
        setMessage(txt);
        setEmotion(emo);
        setInsightType(type);
        speak(txt); // O Bit Fala!
    };

    // --- SMALL TALK ---
    if (lower === 'oi' || lower === 'olá' || lower.includes('e aí')) {
        respond(`E aí, ${firstName}! Tudo tranquilo?`, 'happy', 'tip');
        return;
    }
    if (lower.includes('piada')) {
        const jokes = [
            "Por que o dinheiro não nasce em árvore? Porque os bancos já tem muitas filiais.",
            "Qual o animal que não vale mais nada? O javali.",
        ];
        respond(jokes[Math.floor(Math.random() * jokes.length)], 'happy', 'tip');
        return;
    }

    // --- NAVEGAÇÃO ---
    if (lower.includes('ir para') || lower.includes('abrir') || lower.includes('ver')) {
        if (lower.includes('dashboard') || lower.includes('painel') || lower.includes('início')) {
            navigate('/');
            respond("Teleportando para o Painel.", 'normal', 'tip');
        } else if (lower.includes('transa') || lower.includes('extrato')) {
            navigate('/transactions');
            respond("Abrindo Extrato.", 'normal', 'tip');
        } else if (lower.includes('meta')) {
            navigate('/goals');
            respond("Indo para Metas.", 'happy', 'tip');
        } else if (lower.includes('config')) {
            navigate('/settings');
            respond("Abrindo Configurações.", 'normal', 'tip');
        } else {
            respond("Não entendi o destino. Tente 'Ir para Painel'.", 'thinking', 'warning');
        }
        return;
    }

    // --- CONSULTAS ---
    if (lower.includes('saldo') || lower.includes('quanto tenho')) {
        const balanceStr = totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const text = totalBalance > 0 
            ? `Seu saldo é R$ ${balanceStr}.` 
            : `Saldo negativo de R$ ${balanceStr}. Atenção!`;
        respond(text, totalBalance > 0 ? 'happy' : 'alert', 'analysis');
        return;
    }

    if (lower.includes('quanto gastei')) {
        const targetCategory = categories.find(c => lower.includes(c.name.toLowerCase()));
        if (targetCategory) {
            const sum = transactions
                .filter(t => t.categoryId === targetCategory.id && t.type === 'expense')
                .reduce((acc, t) => acc + t.amount, 0);
            respond(`Total em ${targetCategory.name}: R$ ${sum.toLocaleString('pt-BR')}.`, 'analysis', 'analysis');
        } else {
            respond("De qual categoria? Tente 'Quanto gastei em Jogos'.", 'thinking', 'warning');
        }
        return;
    }

    // --- AÇÕES (TRANSAÇÕES/METAS) ---
    const valueMatch = lower.match(/(\d+([.,]\d{1,2})?)/);
    const amount = valueMatch ? parseFloat(valueMatch[0].replace(',', '.')) : 0;

    if (amount === 0) {
        respond(`Não entendi o valor. Tente "Gastei 50 reais".`, 'thinking', 'warning');
        return;
    }

    // NOVA META
    if (lower.includes('meta') || lower.includes('objetivo')) {
        const wordsToRemove = ['nova', 'criar', 'meta', 'objetivo', 'de', 'valor', 'reais', 'para'];
        let cleanName = lower;
        wordsToRemove.forEach(w => cleanName = cleanName.replace(w, ''));
        if (valueMatch) cleanName = cleanName.replace(valueMatch[0], '');
        cleanName = cleanName.trim();
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        
        addGoal({
            name: cleanName || 'Nova Meta',
            targetAmount: amount,
            currentAmount: 0,
            deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            icon: '🎯',
            color: 'text-yellow-400'
        });

        respond(`Meta "${cleanName || 'Nova'}" criada com sucesso!`, 'happy', 'success');
        return;
    }

    // NOVA TRANSAÇÃO
    const incomeKeywords = ['recebi', 'ganhei', 'depósito', 'salário', 'pix', 'lucrei', 'faturei'];
    const isIncome = incomeKeywords.some(keyword => lower.includes(keyword));
    const type: TransactionType = isIncome ? 'income' : 'expense';

    let cleanDesc = lower;
    if (valueMatch) cleanDesc = cleanDesc.replace(valueMatch[0], '');
    const stopWords = [...incomeKeywords, 'gastei', 'paguei', 'comprei', 'reais', 'real', 'com', 'no', 'na', 'de', 'para', 'o', 'a', 'um'];
    stopWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleanDesc = cleanDesc.replace(regex, '');
    });
    cleanDesc = cleanDesc.replace(/\s+/g, ' ').trim();
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
    if (cleanDesc.length === 0) cleanDesc = isIncome ? "Nova Receita" : "Nova Despesa";

    const validCategories = categories.filter(c => c.type === type);
    let matchedCategory = validCategories.find(c => lower.includes(c.name.toLowerCase()));
    let finalCatId = matchedCategory?.id;
    let finalAccId = accounts[0].id;

    if (!finalCatId) {
        const suggestion = suggestCategoryAndAccount(cleanDesc);
        const suggestedCat = categories.find(c => c.id === suggestion.categoryId);
        if (suggestedCat && suggestedCat.type === type) {
            finalCatId = suggestedCat.id;
            finalAccId = suggestion.accountId || accounts[0].id;
        } else {
            finalCatId = validCategories[0]?.id || categories[0].id;
        }
    }

    addTransaction({
        description: cleanDesc,
        amount: amount,
        type: type,
        date: new Date().toISOString(),
        categoryId: finalCatId!,
        accountId: finalAccId,
        isRecurring: false
    });

    respond(`${getSuccessPhrase(amount, type)}`, 'happy', 'success');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setEmotion('normal');
      return;
    }

    if (!window.isSecureContext) {
        setMessage("Erro: Voz requer HTTPS.");
        setInsightType('warning');
        setEmotion('alert');
        setIsOpen(true);
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setMessage("Navegador incompatível com voz.");
      setInsightType('warning');
      setIsOpen(true);
      return;
    }

    try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.lang = 'pt-BR';
        recognition.continuous = false; 
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          // Cancela qualquer fala do robô ao começar a ouvir
          window.speechSynthesis.cancel();
          setIsListening(true);
          setEmotion('listening');
          setVoiceText("");
          setMessage(`Estou ouvindo...`);
          setInsightType('voice');
          setIsOpen(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            else interimTranscript += event.results[i][0].transcript;
          }
          if (interimTranscript) {
             setVoiceText(interimTranscript);
             setMessage(interimTranscript + "..."); 
          }
          if (finalTranscript) {
             setVoiceText(finalTranscript);
             stopListening();
             setTimeout(() => processVoiceCommand(finalTranscript), 200);
          }
        };

        recognition.onerror = (event: any) => {
          stopListening();
          setMessage("Não entendi.");
          setInsightType('warning');
          setEmotion('thinking');
          setIsOpen(true);
        };

        recognition.onend = () => {
          if (isListening) {
             setIsListening(false);
             if (voiceText) processVoiceCommand(voiceText);
             else if (emotion === 'listening') setEmotion('normal');
          }
        };
        recognition.start();
    } catch (e) {
        setMessage("Erro no microfone.");
        setInsightType('warning');
        setIsOpen(true);
    }
  };

  // --- UI ---

  const handleInteract = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (!isListening) {
          // Se clicar e estiver fechado, fala algo aleatório ou a quest
          if (Math.random() > 0.5) {
             setMessage(dailyQuest);
             setInsightType('quest');
             speak(dailyQuest);
          } else {
             const txt = `Olá, ${firstName}. Em que posso ajudar?`;
             setMessage(txt);
             speak(txt);
          }
          setEmotion('happy');
      }
    } else {
      toggleListening();
    }
  };

  const InsightIcon = () => {
    if (isListening) return <Loader2 size={16} className="text-blue-400 animate-spin" />;
    switch(insightType) {
      case 'warning': return <ShieldAlert size={16} className="text-red-400" />;
      case 'success': return <Check size={16} className="text-emerald-400" />;
      case 'voice': return <Mic size={16} className="text-blue-400" />;
      case 'analysis': return <Wallet size={16} className="text-blue-400" />;
      case 'quest': return <Swords size={16} className="text-purple-400" />;
      case 'tip': return <Info size={16} className="text-blue-400" />;
      default: return <Lightbulb size={16} className="text-yellow-400" />;
    }
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-2 pointer-events-none">
      
      {/* Balão de Fala Inteligente */}
      <div 
        className={clsx(
          "pointer-events-auto bg-slate-900 border-2 max-w-[280px] p-4 rounded-t-2xl rounded-bl-2xl shadow-2xl transform transition-all duration-300 origin-bottom-right mb-2 relative backdrop-blur-md",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-10 pointer-events-none",
          insightType === 'warning' ? "border-red-500/50 shadow-red-900/20" : 
          insightType === 'success' ? "border-emerald-500/50 shadow-emerald-900/20" :
          insightType === 'quest' ? "border-purple-500/50 shadow-purple-900/20" :
          "border-blue-500/50 shadow-blue-900/20"
        )}
      >
        <div className="absolute top-2 right-2 flex gap-2">
            <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-slate-500 hover:text-white transition-colors"
                title={isMuted ? "Ativar Voz" : "Mutar"}
            >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button 
                onClick={() => { setIsOpen(false); stopListening(); }} 
                className="text-slate-500 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>
        
        <div className="flex gap-3">
           <div className="mt-0.5 shrink-0">
              <InsightIcon />
           </div>
           <div>
              <p className={clsx(
                "font-display text-sm leading-relaxed",
                insightType === 'warning' ? "text-red-100 font-medium" : 
                insightType === 'quest' ? "text-purple-200 font-bold" :
                "text-slate-200"
              )}>
                {insightType === 'quest' && <span className="block text-xs uppercase tracking-widest text-purple-400 mb-1">Quest Diária</span>}
                {message}
              </p>
              {isListening && (
                 <div className="flex gap-1 mt-2 justify-center h-2 items-end">
                    <div className="w-1 h-2 bg-blue-500 animate-[bounce_1s_infinite]"></div>
                    <div className="w-1 h-3 bg-blue-400 animate-[bounce_1.2s_infinite]"></div>
                    <div className="w-1 h-4 bg-blue-300 animate-[bounce_0.8s_infinite]"></div>
                    <div className="w-1 h-2 bg-blue-500 animate-[bounce_1s_infinite]"></div>
                 </div>
              )}
           </div>
        </div>
        
        <div className={clsx(
          "absolute -bottom-2.5 right-6 w-4 h-4 bg-slate-900 border-b-2 border-r-2 transform rotate-45",
          insightType === 'warning' ? "border-red-500/50" : 
          insightType === 'success' ? "border-emerald-500/50" :
          insightType === 'quest' ? "border-purple-500/50" :
          "border-blue-500/50"
        )}></div>
      </div>

      {/* Avatar do Mascote */}
      <button 
        onClick={handleInteract}
        className={clsx(
          "pointer-events-auto relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all hover:scale-110 active:scale-95 group bg-slate-900",
          emotion === 'alert' ? "border-red-500 shadow-red-500/50" : 
          emotion === 'happy' ? "border-emerald-400 shadow-emerald-500/50" :
          emotion === 'listening' ? "border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.8)] scale-110 ring-4 ring-blue-500/20" :
          "border-blue-400 shadow-blue-500/50",
          (isBouncing || isListening) && "animate-bounce"
        )}
      >
        <div className={clsx(
          "absolute inset-0 rounded-full opacity-50 blur-md group-hover:opacity-80 transition-opacity",
          emotion === 'alert' ? "bg-red-500" : 
          emotion === 'happy' ? "bg-emerald-400" :
          "bg-blue-400"
        )}></div>

        <div className="relative z-10 text-white transition-all duration-300">
           {emotion === 'alert' ? <AlertTriangle size={32} /> : 
            emotion === 'happy' ? <TrendingUp size={32} /> :
            emotion === 'listening' ? <Mic size={32} /> :
            <Bot size={32} />
           }
        </div>

        {emotion === 'normal' && !isListening && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-3 z-20 pointer-events-none">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75"></div>
          </div>
        )}

        {/* Botão de Mic Overlay (Mobile Friendly) */}
        {!isListening && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg">
                <Mic size={12} />
            </div>
        )}
      </button>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded absolute -bottom-6 right-2 whitespace-nowrap pointer-events-none backdrop-blur">
        Assistente Bit
      </div>

    </div>
  );
};