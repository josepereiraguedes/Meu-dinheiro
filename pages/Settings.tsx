import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Select, IconSelector, AvatarInput } from '../components/RetroUI';
import { Save, RefreshCw, LogOut, Bell, BellOff, Plus, Trash2, Tag, Upload, User, FileSpreadsheet, Edit2, Lock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { clsx } from 'clsx';

const Settings: React.FC = () => {
  const { 
    user, updateUser, transactions, accounts, goals, categories, budgets, 
    resetData, importData, addAccount, updateAccount, removeAccount, 
    addCategory, updateCategory, removeCategory, setAppPin 
  } = useFinance();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State para Perfil
  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatar, setProfileAvatar] = useState(user.avatar);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  
  // State para PIN
  const [pinInput, setPinInput] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);

  // State para Contas (Novo + Edição)
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountLimit, setAccountLimit] = useState(''); 
  const [accountType, setAccountType] = useState('checking');
  const [accountIcon, setAccountIcon] = useState('🏦');

  // State para Categorias (Novo + Edição)
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('expense');
  const [catIcon, setCatIcon] = useState('🍔');

  // Update default account icon when type changes (only if adding new)
  useEffect(() => {
    if (!editingAccountId) {
        if (accountType === 'checking') setAccountIcon('🏦');
        if (accountType === 'wallet') setAccountIcon('👛');
        if (accountType === 'investment') setAccountIcon('🪙');
        if (accountType === 'credit_card') setAccountIcon('💳');
    }
  }, [accountType, editingAccountId]);

  // Check for profile changes
  useEffect(() => {
    setHasProfileChanges(profileName !== user.name || profileAvatar !== user.avatar);
  }, [profileName, profileAvatar, user.name, user.avatar]);

  const handleBackup = () => {
    const data = {
      transactions,
      accounts,
      goals,
      categories,
      budgets,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-dinheiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Descricao,Valor,Tipo,Categoria,Conta\n";

    // Rows
    transactions.forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sem Categoria';
        const accName = accounts.find(a => a.id === t.accountId)?.name || 'Sem Conta';
        
        // Format date and numbers for standard CSV/Excel
        const date = new Date(t.date).toLocaleDateString('pt-BR');
        const amount = t.amount.toFixed(2);
        const type = t.type === 'income' ? 'Receita' : 'Despesa';
        
        const row = `${date},"${t.description}",${amount},${type},"${catName}","${accName}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProfile = () => {
    updateUser({ name: profileName, avatar: profileAvatar });
    setHasProfileChanges(false);
  };

  const handleSetPin = () => {
     if (pinInput.length === 4) {
        setAppPin(pinInput);
        setPinInput("");
        setShowPinInput(false);
     }
  };

  // --- ACCOUNTS LOGIC ---

  const prepareEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setAccountName(acc.name);
    setAccountBalance(acc.balance.toString());
    setAccountType(acc.type);
    setAccountLimit(acc.creditLimit ? acc.creditLimit.toString() : '');
    setAccountIcon(acc.icon);
    setShowAccountForm(true);
  };

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountName('');
    setAccountBalance('');
    setAccountLimit('');
    setAccountType('checking');
    setAccountIcon('🏦');
    setShowAccountForm(false);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName) return;

    let color = 'text-blue-400';
    if (accountType === 'wallet') { color = 'text-emerald-400'; }
    if (accountType === 'investment') { color = 'text-violet-400'; }
    if (accountType === 'credit_card') { color = 'text-rose-400'; }

    const payload = {
      name: accountName,
      type: accountType as any,
      creditLimit: accountType === 'credit_card' && accountLimit ? parseFloat(accountLimit) : undefined,
      icon: accountIcon,
      color
    };

    if (editingAccountId) {
        // Edit mode
        updateAccount(editingAccountId, { ...payload, balance: parseFloat(accountBalance) });
    } else {
        // Create mode
        addAccount({
           ...payload,
           balance: parseFloat(accountBalance) || 0,
        });
    }

    resetAccountForm();
  };

  // --- CATEGORIES LOGIC ---

  const prepareEditCategory = (cat: any) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatType('expense');
    setCatIcon('🍔');
    setShowCategoryForm(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    
    const color = catType === 'income' ? 'text-emerald-400' : 'text-rose-400';
    
    if (editingCategoryId) {
        updateCategory(editingCategoryId, {
            name: catName,
            type: catType as any,
            icon: catIcon,
            color
        });
    } else {
        addCategory({
            name: catName,
            type: catType as any,
            icon: catIcon,
            color
        });
    }

    resetCategoryForm();
  };

  return (
    <div className="space-y-6">
       <div className="mb-6">
         <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wider text-shadow-glow">Configurações</h1>
         <p className="text-slate-400">Ajuste suas preferências de sistema</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Seção de Perfil */}
         <Card title="Meu Perfil" className="md:col-span-1">
            <div className="flex flex-col gap-4">
               <div className="flex justify-center mb-2">
                 <AvatarInput value={profileAvatar} onChange={setProfileAvatar} />
               </div>
               <Input 
                 label="Seu Nickname"
                 value={profileName}
                 onChange={(e) => setProfileName(e.target.value)}
               />
               
               {/* PIN Security Section */}
               <div className="mt-2 bg-slate-900/50 p-3 rounded-xl border border-blue-500/20">
                   {!showPinInput ? (
                       <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-slate-300">
                               <Lock size={16} />
                               <span className="text-sm font-bold">PIN de Segurança</span>
                           </div>
                           <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setShowPinInput(true)}>
                               {user.securityPin ? 'Alterar' : 'Configurar'}
                           </Button>
                       </div>
                   ) : (
                       <div className="space-y-2 animate-in slide-in-from-top-2">
                           <label className="text-xs text-blue-400 font-bold uppercase">Novo PIN (4 Dígitos)</label>
                           <div className="flex gap-2">
                               <Input 
                                 type="password" 
                                 maxLength={4}
                                 placeholder="1234"
                                 value={pinInput}
                                 onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                                 className="text-center tracking-[1em] font-bold"
                               />
                               <Button variant="primary" onClick={handleSetPin} disabled={pinInput.length !== 4}>OK</Button>
                               <Button variant="secondary" onClick={() => { setShowPinInput(false); setPinInput(""); }}>X</Button>
                           </div>
                       </div>
                   )}
               </div>

               <Button 
                 variant="primary" 
                 icon={Save} 
                 disabled={!hasProfileChanges}
                 onClick={handleSaveProfile}
                 className="w-full mt-2"
               >
                 Salvar Perfil
               </Button>
            </div>
         </Card>

         {/* Seção de Contas */}
         <Card title="Gerenciar Contas" className="md:col-span-1">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
               {accounts.map(acc => (
                 <div 
                    key={acc.id} 
                    className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-white/5 hover:border-blue-500/20 group transition-all"
                    onClick={() => prepareEditAccount(acc)}
                 >
                    <div className="flex items-center gap-3 cursor-pointer">
                       <span className={`text-xl ${acc.color}`}>{acc.icon}</span>
                       <div>
                         <p className="font-bold text-white text-sm">{acc.name}</p>
                         <p className="text-[10px] text-slate-500 uppercase">
                           {acc.type.replace('_', ' ')} • Limite: {acc.creditLimit || '-'}
                         </p>
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100">
                        <button className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors">
                            <Edit2 size={14} />
                        </button>
                        <button 
                             onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }}
                             className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors"
                        >
                             <Trash2 size={14} />
                        </button>
                    </div>
                 </div>
               ))}

               {!showAccountForm ? (
                 <Button variant="secondary" className="w-full border-dashed text-sm" icon={Plus} onClick={() => { resetAccountForm(); setShowAccountForm(true); }}>
                   Nova Conta
                 </Button>
               ) : (
                 <form onSubmit={handleSaveAccount} className="bg-slate-800/50 p-3 rounded-xl border border-blue-500/30 space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-blue-400 uppercase">{editingAccountId ? 'Editar Conta' : 'Nova Conta'}</h4>
                        <button type="button" onClick={resetAccountForm}><span className="text-xs text-slate-500">X</span></button>
                    </div>
                    
                    <Input placeholder="Nome da Conta" value={accountName} onChange={e => setAccountName(e.target.value)} className="text-sm py-2" />
                    
                    <Select 
                        value={accountType}
                        onChange={e => setAccountType(e.target.value)}
                        className="text-sm py-2"
                        label="Tipo de Conta"
                        options={[
                          { value: 'checking', label: 'Corrente' },
                          { value: 'wallet', label: 'Carteira' },
                          { value: 'investment', label: 'Investimento' },
                          { value: 'credit_card', label: 'Cartão de Crédito' },
                        ]}
                      />

                    <IconSelector 
                      label="Escolha um ícone"
                      selected={accountIcon}
                      onSelect={setAccountIcon}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="0.00" label="Saldo Atual" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} className="text-sm py-2" />
                      {accountType === 'credit_card' && (
                       <Input 
                        type="number" 
                        placeholder="0.00" 
                        label="Limite"
                        value={accountLimit} 
                        onChange={e => setAccountLimit(e.target.value)} 
                        className="text-sm py-2 animate-in slide-in-from-top-2" 
                       />
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                       <Button type="button" variant="secondary" className="py-1 px-3 text-xs" onClick={resetAccountForm}>Cancelar</Button>
                       <Button type="submit" variant="primary" className="py-1 px-3 text-xs">{editingAccountId ? 'Atualizar' : 'Criar'}</Button>
                    </div>
                 </form>
               )}
            </div>
         </Card>

         {/* Seção de Categorias */}
         <Card title="Gerenciar Categorias" className="md:col-span-1">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
               {categories.map(cat => (
                 <div 
                    key={cat.id} 
                    className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-white/5 hover:border-blue-500/20 group transition-colors"
                    onClick={() => prepareEditCategory(cat)}
                 >
                    <div className="flex items-center gap-3 cursor-pointer">
                       <span className="text-xl">{cat.icon}</span>
                       <div>
                         <p className="font-bold text-white text-sm">{cat.name}</p>
                         <span className={`text-[10px] px-1.5 rounded border ${cat.type === 'income' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                           {cat.type === 'income' ? 'Entrada' : 'Saída'}
                         </span>
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100">
                        <button className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors">
                            <Edit2 size={14} />
                        </button>
                        <button 
                             onClick={(e) => { e.stopPropagation(); removeCategory(cat.id); }}
                             className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors"
                        >
                             <Trash2 size={14} />
                        </button>
                    </div>
                 </div>
               ))}

               {!showCategoryForm ? (
                 <Button variant="secondary" className="w-full border-dashed text-sm" icon={Plus} onClick={() => { resetCategoryForm(); setShowCategoryForm(true); }}>
                   Nova Categoria
                 </Button>
               ) : (
                 <form onSubmit={handleSaveCategory} className="bg-slate-800/50 p-3 rounded-xl border border-blue-500/30 space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-blue-400 uppercase">{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</h4>
                        <button type="button" onClick={resetCategoryForm}><span className="text-xs text-slate-500">X</span></button>
                    </div>

                    <Input placeholder="Nome da Categoria" value={catName} onChange={e => setCatName(e.target.value)} className="text-sm py-2" />
                    
                    <Select 
                      value={catType}
                      onChange={e => setCatType(e.target.value)}
                      className="text-sm py-2"
                      label="Tipo"
                      options={[
                        { value: 'expense', label: 'Despesa' },
                        { value: 'income', label: 'Receita' },
                      ]}
                    />

                    <IconSelector 
                      label="Escolha um ícone"
                      selected={catIcon}
                      onSelect={setCatIcon}
                    />

                    <div className="flex gap-2 justify-end pt-2">
                       <Button type="button" variant="secondary" className="py-1 px-3 text-xs" onClick={resetCategoryForm}>Cancelar</Button>
                       <Button type="submit" variant="primary" className="py-1 px-3 text-xs">{editingCategoryId ? 'Atualizar' : 'Criar'}</Button>
                    </div>
                 </form>
               )}
            </div>
         </Card>

         <Card title="Dados e Relatórios">
            <div className="flex flex-col gap-3">
               <div className="grid grid-cols-2 gap-3">
                 <Button variant="primary" icon={Save} onClick={handleBackup} className="w-full text-sm">Backup JSON</Button>
                 <Button variant="secondary" icon={Upload} onClick={handleImportClick} className="w-full text-sm">Restaurar</Button>
               </div>
               <Button variant="success" icon={FileSpreadsheet} onClick={handleExportCSV} className="w-full">
                  Gerar Relatório CSV (Excel)
               </Button>
               
               <input 
                 type="file" 
                 accept=".json" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileChange}
               />
               
               <div className="border-t border-white/5 my-2"></div>
               
               <Button variant="danger" icon={RefreshCw} onClick={resetData} className="w-full">
                 Resetar Todo o Progresso
               </Button>
            </div>
         </Card>
       </div>
    </div>
  );
};

export default Settings;