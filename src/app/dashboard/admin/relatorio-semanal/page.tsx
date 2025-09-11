'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminRelatorioSemanal from '@/components/AdminRelatorioSemanal';

export default function AdminRelatorioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se tiver erro nas APIs (sem permissão), o próprio componente AdminRelatorioSemanal vai tratar
  return <AdminRelatorioSemanal />;
}