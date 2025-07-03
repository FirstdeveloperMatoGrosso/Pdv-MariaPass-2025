import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Função para atualizar o email do usuário
    const updateUserEmail = () => {
      const email = localStorage.getItem('user_email');
      setUserEmail(email);
    };

    // Atualiza o email quando o componente é montado
    updateUserEmail();

    // Adiciona um listener para atualizar quando o localStorage mudar
    window.addEventListener('storage', updateUserEmail);

    // Limpa o listener quando o componente é desmontado
    return () => {
      window.removeEventListener('storage', updateUserEmail);
    };
  }, []);

  const handleLogout = () => {
    // Remove os dados de autenticação
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    // Redireciona para a página de login
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-green-200 bg-green-50 px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">
          <span className="text-pink-500">Maria</span>
          <span className="text-blue-600">Pass</span>
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {userEmail && (
          <div className="flex items-center space-x-2 rounded-full bg-green-100 px-3 py-1.5 text-sm border border-green-200">
            <User className="h-4 w-4 text-green-700" />
            <span className="font-medium text-green-800">{userEmail}</span>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-green-700 hover:bg-green-100 hover:text-green-900"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
