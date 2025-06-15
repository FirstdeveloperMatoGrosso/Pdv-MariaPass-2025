
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  name: string;
  address: string;
  cnpj: string;
  email: string;
  phone: string;
  logo?: string;
}

interface CompanyConfigProps {
  onDataChange?: (data: CompanyData) => void;
}

const CompanyConfig: React.FC<CompanyConfigProps> = ({ onDataChange }) => {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: 'MariaPass - Sistema de Totem',
    address: 'Rua das Flores, 123 - Centro, São Paulo - SP, 01234-567',
    cnpj: '12.345.678/0001-90',
    email: 'contato@mariapass.com.br',
    phone: '(11) 98765-4321'
  });

  useEffect(() => {
    // Carregar dados salvos do localStorage
    const savedData = localStorage.getItem('companyData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setCompanyData(parsedData);
      onDataChange?.(parsedData);
    } else {
      onDataChange?.(companyData);
    }
  }, []);

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    const newData = { ...companyData, [field]: value };
    setCompanyData(newData);
    onDataChange?.(newData);
  };

  const handleSave = () => {
    localStorage.setItem('companyData', JSON.stringify(companyData));
    toast({
      title: "Dados salvos",
      description: "Os dados da empresa foram salvos com sucesso!",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <span>Dados da Empresa</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="company-name">Nome da Empresa</Label>
          <Input
            id="company-name"
            value={companyData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="company-address">Endereço</Label>
          <Input
            id="company-address"
            value={companyData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="company-cnpj">CNPJ</Label>
          <Input
            id="company-cnpj"
            value={companyData.cnpj}
            onChange={(e) => handleInputChange('cnpj', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="company-email">E-mail</Label>
          <Input
            id="company-email"
            type="email"
            value={companyData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="company-phone">Telefone</Label>
          <Input
            id="company-phone"
            value={companyData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
        
        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Dados
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompanyConfig;
