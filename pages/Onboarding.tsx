import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, Button, Input, AvatarInput } from '../components/RetroUI';
import { Gamepad2, ArrowRight, Check } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { completeOnboarding } = useFinance();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🕹️');
  const [balance, setBalance] = useState('');

  const handleNext = () => {
    if (step === 3) {
      completeOnboarding(name, selectedAvatar, parseFloat(balance) || 0);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background FX */}
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px]"></div>
       </div>

       <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-8">
             <div className="inline-flex p-4 rounded-full bg-slate-900 border border-white/10 shadow-xl mb-4">
                <Gamepad2 className="w-12 h-12 text-blue-500" />
             </div>
             <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wider text-shadow-glow">Meu Dinheiro</h1>
             <p className="text-slate-400 mt-2">Gestão financeira pessoal</p>
          </div>

          <Card className="border-blue-500/30">
             {step === 1 && (
               <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Bem-vindo!</h2>
                    <p className="text-slate-400 text-sm">Como gostaria de ser chamado?</p>
                  </div>
                  <Input 
                    placeholder="Seu nome..." 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="text-center text-lg py-3"
                    autoFocus
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleNext} 
                    disabled={!name.trim()}
                    icon={ArrowRight}
                  >
                    Continuar
                  </Button>
               </div>
             )}

             {step === 2 && (
               <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Sua Foto de Perfil</h2>
                    <p className="text-slate-400 text-sm">Escolha um avatar ou envie sua foto.</p>
                  </div>
                  
                  <AvatarInput 
                    value={selectedAvatar} 
                    onChange={setSelectedAvatar} 
                  />

                  <div className="flex gap-3 mt-4">
                    <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
                    <Button className="flex-1" onClick={handleNext} icon={ArrowRight}>Confirmar</Button>
                  </div>
               </div>
             )}

            {step === 3 && (
               <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Configuração Inicial</h2>
                    <p className="text-slate-400 text-sm">Qual o saldo inicial da sua conta principal?</p>
                  </div>
                  
                  <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 text-center">
                     <p className="text-emerald-400 text-xs uppercase font-bold mb-2">Saldo Atual</p>
                     <Input 
                        type="number"
                        placeholder="R$ 0,00" 
                        value={balance} 
                        onChange={e => setBalance(e.target.value)} 
                        className="text-center text-2xl py-3 font-display font-bold bg-transparent border-none focus:ring-0 placeholder-slate-600"
                        autoFocus
                      />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
                    <Button variant="success" className="flex-1" onClick={handleNext} icon={Check}>Finalizar</Button>
                  </div>
               </div>
             )}
          </Card>
          
          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-800'}`}></div>
            ))}
          </div>
       </div>
    </div>
  );
};

export default Onboarding;