'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Alert,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  plan: 'VIP' | 'LITE' | 'LITE_V2' | 'RENDA_PASSIVA' | 'FIIS' | 'RENDA_TURBINADA' | 'RENDA_TURBINADA_T2' | 'RENDA_TURBINADA_T3' | 'AMERICA' | 'ANALISTA' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  hotmartCustomerId?: string;
  createdAt: string;
  lastLogin?: string;
  totalPurchases: number;
  purchaseCount: number;
  expirationDate?: string;
  origin: 'MANUAL' | 'HOTMART' | 'KIWIFY' | 'EDUZZ';
}

const PAGE_SIZE = 50;
const USERS_CACHE_KEY = 'adminUsersCache';

export default function AdminUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState({ current: 0, total: 0 });
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [originFilter, setOriginFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

  // ✅ FUNÇÃO SIMPLIFICADA - Remove validações problemáticas
  const readUsersCache = () => {
    if (typeof window === 'undefined') return null;

    try {
      const cachedData = window.sessionStorage.getItem(USERS_CACHE_KEY);
      if (!cachedData) {
        console.log('📦 Nenhum cache encontrado');
        return null;
      }

      const parsed = JSON.parse(cachedData);
      if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
        console.log('⚠️ Cache inválido ou vazio');
        return null;
      }

      const payload = {
        users: parsed.users as User[],
        page: Number(parsed.page) || 1,
        totalUsers: Number(parsed.totalUsers) || parsed.users.length,
        lastUpdatedAt: parsed.lastUpdatedAt ? new Date(parsed.lastUpdatedAt) : null
      };

      console.log(`✅ Cache carregado: ${payload.users.length} usuários`);
      console.log(`   - Total registrado: ${payload.totalUsers}`);
      console.log(`   - Última atualização: ${payload.lastUpdatedAt?.toLocaleString('pt-BR')}`);

      return payload;
    } catch (err) {
      console.error('❌ Erro ao ler cache:', err);
      return null;
    }
  };

  // ✅ FUNÇÃO SIMPLIFICADA - Sempre salva o cache
  const saveUsersCache = (payload: {
    users: User[];
    page: number;
    totalUsers: number;
    lastUpdatedAt: Date | null;
  }) => {
    if (typeof window === 'undefined') return;

    try {
      window.sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify({
        users: payload.users,
        page: payload.page,
        totalUsers: payload.totalUsers,
        lastUpdatedAt: payload.lastUpdatedAt ? payload.lastUpdatedAt.toISOString() : null
      }));
      console.log('✅ Cache salvo com sucesso:', payload.users.length, 'usuários');
    } catch (err) {
      console.error('❌ Erro ao salvar cache:', err);
    }
  };

  // Verificar se é admin
  React.useEffect(() => {
    if (user && 'plan' in user && user.plan !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // ✅ EFFECT INICIAL - Apenas carrega do cache, NUNCA busca do banco
  React.useEffect(() => {
    console.log('🔵 Carregando dados iniciais...');
    
    const cachedData = readUsersCache();
    
    if (cachedData) {
      console.log('✅ Cache encontrado:', cachedData.users.length, 'usuários');
      setUsers(cachedData.users);
      setPage(cachedData.page);
      setTotalUsers(cachedData.totalUsers);
      setLastUpdatedAt(cachedData.lastUpdatedAt);
      setLoading(false);
    } else {
      console.log('⚠️ Nenhum cache encontrado, carregando dados do banco...');
      // Só carrega do banco se não houver cache
      loadAllUsers(true);
    }
  }, []); // ✅ Executar apenas uma vez ao montar

  const fetchUsersPage = async (pageToLoad: number) => {
    try {
      console.log('🔄 Buscando página', pageToLoad, 'do banco de dados...');

      const response = await fetch(`/api/admin/users?page=${pageToLoad}&limit=${PAGE_SIZE}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Resposta não é JSON:', textResponse.substring(0, 500));
        throw new Error(`Servidor retornou ${response.status}: Resposta não é JSON válido`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Página', pageToLoad, 'carregada:', data.users?.length || 0, 'usuários');
      
      return {
        users: data.users || [],
        total: data.total || 0
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      
      let errorMessage = 'Erro ao carregar usuários';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('not valid JSON')) {
        errorMessage = 'Erro de comunicação com o servidor. A API pode estar indisponível.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Não autorizado. Faça login novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // ✅ FUNÇÃO PARA ATUALIZAR DADOS - Carrega TODOS os dados até não ter mais
  const loadAllUsers = async (forceRefresh = false) => {
    console.log('🔄 Iniciando carregamento COMPLETO de usuários...');
    setLoading(true);
    setError(null);
    setLoadingMore(false);
    setLoadingProgress({ current: 0, total: 0 });

    try {
      // 1️⃣ Carrega primeira página
      const firstPageData = await fetchUsersPage(1);
      let allUsers = firstPageData.users;
      const totalFromAPI = firstPageData.total || allUsers.length;
      
      setLoadingProgress({ current: allUsers.length, total: totalFromAPI });
      
      console.log(`📊 API reporta ${totalFromAPI} usuários totais`);
      console.log(`📊 Primeira página: ${allUsers.length} usuários`);

      // 2️⃣ Continua carregando ATÉ receber página vazia (ignora o total da API)
      let currentPage = 2;
      let consecutiveEmptyPages = 0;
      const maxEmptyPages = 3; // Para de tentar após 3 páginas vazias consecutivas

      while (consecutiveEmptyPages < maxEmptyPages) {
        console.log(`🔄 Carregando página ${currentPage}... (Total atual: ${allUsers.length})`);
        
        try {
          const pageData = await fetchUsersPage(currentPage);
          
          if (!pageData.users || pageData.users.length === 0) {
            consecutiveEmptyPages++;
            console.log(`⚠️ Página ${currentPage} vazia (${consecutiveEmptyPages}/${maxEmptyPages})`);
            
            // Se já tem mais usuários que o total da API reportou, continue tentando
            if (allUsers.length >= totalFromAPI) {
              console.log(`ℹ️ Já temos ${allUsers.length} usuários (API disse ${totalFromAPI}), mas verificando mais páginas...`);
            }
            
            currentPage++;
            continue;
          }

          // Reset contador de páginas vazias
          consecutiveEmptyPages = 0;
          
          // Adiciona os usuários
          const newUsers = pageData.users;
          allUsers = [...allUsers, ...newUsers];
          
          // ✅ Atualiza progresso em tempo real
          setLoadingProgress({ 
            current: allUsers.length, 
            total: Math.max(totalFromAPI, allUsers.length) 
          });
          
          console.log(`✅ Página ${currentPage}: +${newUsers.length} usuários (Total: ${allUsers.length})`);
          
          currentPage++;
          
          // Pequeno delay para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Erro ao carregar página ${currentPage}:`, error);
          consecutiveEmptyPages++;
          currentPage++;
        }
      }

      // 3️⃣ Agora que tem TODOS os dados, salva tudo de uma vez
      const refreshedAt = new Date();
      const finalTotal = allUsers.length;
      
      console.log(`✅ CARREGAMENTO COMPLETO!`);
      console.log(`   - Total carregado: ${finalTotal} usuários`);
      console.log(`   - Total da API: ${totalFromAPI} usuários`);
      console.log(`   - Páginas carregadas: ${currentPage - 1}`);
      
      setUsers(allUsers);
      setPage(currentPage - 1);
      setTotalUsers(finalTotal);
      setLastUpdatedAt(refreshedAt);
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
      
      // ✅ Salva no cache SOMENTE quando tem TODOS os dados
      saveUsersCache({
        users: allUsers,
        page: currentPage - 1,
        totalUsers: finalTotal,
        lastUpdatedAt: refreshedAt
      });

      console.log(`💾 Cache salvo com ${finalTotal} usuários`);

    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      setError(error.message || 'Erro ao carregar usuários');
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
    }
  };

  const handleEditUser = (userId: string) => {
    router.push(`/dashboard/admin/usuarios/${userId}`);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      const updatedUsers = users.filter(u => u.id !== userId);
      const refreshedAt = new Date();

      setUsers(updatedUsers);
      setTotalUsers(Math.max(totalUsers - 1, updatedUsers.length));
      setLastUpdatedAt(refreshedAt);
      saveUsersCache({
        users: updatedUsers,
        page,
        totalUsers: Math.max(totalUsers - 1, updatedUsers.length),
        lastUpdatedAt: refreshedAt
      });
      alert('✅ Usuário excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert(`❌ Erro ao excluir usuário: ${error.message}`);
    }
  };

  const getPlanInfo = (plan: string) => {
    const planMap = {
      'VIP': { label: 'Close Friends VIP', color: '#7C3AED', emoji: '👑' },
      'LITE': { label: 'Close Friends LITE', color: '#2563EB', emoji: '⭐' },
      'LITE_V2': { label: 'Close Friends LITE 2.0', color: '#1d4ed8', emoji: '⭐' },
      'RENDA_PASSIVA': { label: 'Projeto Renda Passiva', color: '#059669', emoji: '💰' },
      'FIIS': { label: 'Projeto FIIs', color: '#D97706', emoji: '🏢' },
      'RENDA_TURBINADA': { label: 'CF Renda Turbinada', color: '#F97316', emoji: '⚡' },
      'RENDA_TURBINADA_T2': { label: 'CF Renda Turbinada - Turma 2', color: '#FB923C', emoji: '⚡' },
      'RENDA_TURBINADA_T3': { label: 'CF Renda Turbinada - Turma 3', color: '#FDBA74', emoji: '⚡' },
      'AMERICA': { label: 'Projeto América', color: '#DC2626', emoji: '🗽' },
      'ANALISTA': { label: 'Analista', color: '#2563EB', emoji: '📊' },
      'ADMIN': { label: 'Administrador', color: '#4B5563', emoji: '👨‍💼' }
    };
    return planMap[plan as keyof typeof planMap] || { label: plan, color: '#6B7280', emoji: '📋' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0);
    } catch {
      return 'R$ 0,00';
    }
  };

  const isExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    try {
      return new Date(expirationDate) < new Date();
    } catch {
      return false;
    }
  };

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const normalizedSearchTerm = normalizeText(searchTerm);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !normalizedSearchTerm ||
      normalizeText(user.firstName).includes(normalizedSearchTerm) ||
      normalizeText(user.lastName).includes(normalizedSearchTerm) ||
      normalizeText(user.email).includes(normalizedSearchTerm);

    const matchesPlan = !planFilter || user.plan === planFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    const matchesOrigin = !originFilter || user.origin === originFilter;

    return matchesSearch && matchesPlan && matchesStatus && matchesOrigin;
  });

  const filtersActive = Boolean(planFilter || statusFilter || originFilter || normalizedSearchTerm);

  const handleExportEmails = () => {
    if (filteredUsers.length === 0) {
      alert('Nenhum usuário encontrado para exportar com os filtros atuais.');
      return;
    }

    const headers = ['nome_completo', 'email', 'plano', 'status', 'origem'];

    const rows = filteredUsers.map(user => [
      `${user.firstName} ${user.lastName}`.trim(),
      user.email,
      user.plan,
      user.status,
      user.origin
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row =>
        row
          .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(';')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios-emails-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const planStats = React.useMemo(() => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      byPlan: {
        VIP: users.filter(u => u.plan === 'VIP').length,
        LITE: users.filter(u => u.plan === 'LITE').length,
        LITE_V2: users.filter(u => u.plan === 'LITE_V2').length,
        FIIS: users.filter(u => u.plan === 'FIIS').length,
        RENDA_PASSIVA: users.filter(u => u.plan === 'RENDA_PASSIVA').length,
        RENDA_TURBINADA: users.filter(u => u.plan === 'RENDA_TURBINADA').length,
        RENDA_TURBINADA_T2: users.filter(u => u.plan === 'RENDA_TURBINADA_T2').length,
        RENDA_TURBINADA_T3: users.filter(u => u.plan === 'RENDA_TURBINADA_T3').length,
        AMERICA: users.filter(u => u.plan === 'AMERICA').length,
        ANALISTA: users.filter(u => u.plan === 'ANALISTA').length,
        ADMIN: users.filter(u => u.plan === 'ADMIN').length
      }
    };
    return stats;
  }, [users]);

  if (loading) {
    const progressPercentage = loadingProgress.total > 0 
      ? Math.round((loadingProgress.current / loadingProgress.total) * 100)
      : 0;

    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" sx={{ backgroundColor: '#F8FAFC', p: 4 }}>
        <CircularProgress size={60} sx={{ color: '#3B82F6', mb: 3 }} />
        
        <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.1rem', mb: 1 }}>
          🔄 Carregando todos os usuários...
        </Typography>
        
        {loadingProgress.current > 0 && (
          <>
            <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.5rem', mb: 1 }}>
              {loadingProgress.current} {loadingProgress.total > 0 && `/ ~${loadingProgress.total}`}
            </Typography>
            
            {progressPercentage > 0 && (
              <Box sx={{ width: '300px', bgcolor: '#E2E8F0', borderRadius: 2, height: 8, mb: 2, overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    width: `${Math.min(progressPercentage, 100)}%`, 
                    bgcolor: '#3B82F6', 
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </Box>
            )}
          </>
        )}
        
        <Typography sx={{ color: '#64748B', fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
          Aguarde enquanto carregamos todos os dados do banco. Isso pode levar alguns minutos...
        </Typography>
        
        <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 2, textAlign: 'center' }}>
          💡 Os dados serão salvos em cache e carregarão instantaneamente nas próximas vezes
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={5}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1E293B', fontWeight: '700', fontSize: '2rem' }}>
          🛡️ Gerenciamento de Usuários
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', fontSize: '1rem' }}>
          Gerencie usuários, planos e integrações com Hotmart/Kiwify
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FECACA',
            color: '#991B1B',
            borderRadius: 2
          }} 
          action={
            <Button color="inherit" size="small" onClick={() => loadAllUsers(true)} disabled={loading}>
              Tentar Novamente
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* ✅ Indicador de dados em cache */}
      {lastUpdatedAt && !loading && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            backgroundColor: '#EFF6FF', 
            border: '1px solid #BFDBFE',
            color: '#1E40AF'
          }}
        >
          <Typography variant="body2">
            📊 Exibindo {users.length} usuários do cache | Última atualização: {lastUpdatedAt.toLocaleString('pt-BR')}
          </Typography>
        </Alert>
      )}

      {/* ⚠️ Alerta quando não há cache */}
      {!lastUpdatedAt && !loading && users.length === 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3, 
            backgroundColor: '#FEF3C7', 
            border: '1px solid #FCD34D',
            color: '#92400E'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ⚠️ Nenhum dado em cache. Clique em "Atualizar dados" para carregar os usuários do banco.
          </Typography>
        </Alert>
      )}

      {/* Busca e Botões */}
      <Box
        mb={4}
        display="flex"
        justifyContent={{ xs: 'flex-start', lg: 'space-between' }}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        flexDirection={{ xs: 'column', lg: 'row' }}
        gap={2}
      >
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} width="100%">
          <TextField
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span style={{ color: '#64748B' }}>🔍</span>
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              width: { xs: '100%', md: '280px', lg: '320px' },
              '& .MuiInputBase-input': {
                color: '#1E293B',
                fontSize: '0.95rem'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
              }
            }}
          />

          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="plan-filter-label">Plano</InputLabel>
              <Select
                labelId="plan-filter-label"
                value={planFilter}
                label="Plano"
                onChange={(e) => setPlanFilter(e.target.value as string)}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                <MenuItem value="VIP">Close Friends VIP</MenuItem>
                <MenuItem value="LITE">Close Friends LITE</MenuItem>
                <MenuItem value="LITE_V2">Close Friends LITE 2.0</MenuItem>
                <MenuItem value="RENDA_PASSIVA">Projeto Renda Passiva</MenuItem>
                <MenuItem value="FIIS">Projeto FIIs</MenuItem>
                <MenuItem value="RENDA_TURBINADA">CF Renda Turbinada</MenuItem>
                <MenuItem value="RENDA_TURBINADA_T2">CF Renda Turbinada - T2</MenuItem>
                <MenuItem value="RENDA_TURBINADA_T3">CF Renda Turbinada - T3</MenuItem>
                <MenuItem value="AMERICA">Projeto América</MenuItem>
                <MenuItem value="ANALISTA">Analista</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as string)}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                <MenuItem value="ACTIVE">Ativo</MenuItem>
                <MenuItem value="INACTIVE">Inativo</MenuItem>
                <MenuItem value="PENDING">Pendente</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="origin-filter-label">Origem</InputLabel>
              <Select
                labelId="origin-filter-label"
                value={originFilter}
                label="Origem"
                onChange={(e) => setOriginFilter(e.target.value as string)}
              >
                <MenuItem value=""><em>Todas</em></MenuItem>
                <MenuItem value="MANUAL">Manual</MenuItem>
                <MenuItem value="HOTMART">Hotmart</MenuItem>
                <MenuItem value="KIWIFY">Kiwify</MenuItem>
                <MenuItem value="EDUZZ">Eduzz</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="text"
              disabled={!filtersActive}
              onClick={() => {
                setSearchTerm('');
                setPlanFilter('');
                setStatusFilter('');
                setOriginFilter('');
              }}
              sx={{
                textTransform: 'none',
                color: filtersActive ? '#3B82F6' : '#94A3B8',
                fontWeight: '600'
              }}
            >
              Limpar filtros
            </Button>
          </Box>
        </Box>

        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
          width={{ xs: '100%', lg: 'auto' }}
        >
          {/* ✅ Botão Atualizar com indicador de quando foi atualizado */}
          <Button
            variant="outlined"
            disabled={loading}
            onClick={() => loadAllUsers(true)}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#2563EB',
              borderColor: '#93C5FD',
              fontWeight: '600',
              '&:hover': { bgcolor: '#EFF6FF', borderColor: '#60A5FA' },
              '&:disabled': { color: '#94A3B8', borderColor: '#E2E8F0' },
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: 'none',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {loading ? '🔄 Atualizando...' : '🔄 Atualizar dados'}
          </Button>

          <Button
            variant="outlined"
            disabled={loading}
            sx={{
              borderColor: '#10B981',
              color: '#10B981',
              fontWeight: '600',
              '&:hover': { 
                borderColor: '#059669', 
                backgroundColor: '#F0FDF4',
                color: '#059669'
              },
              '&:disabled': { 
                borderColor: '#94A3B8',
                color: '#94A3B8'
              },
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: 'none',
              width: { xs: '100%', sm: 'auto' }
            }}
            onClick={() => router.push('/dashboard/admin/import-usuarios')}
          >
            📤 Importar em Massa
          </Button>

          <Button
            variant="outlined"
            disabled={loading}
            onClick={handleExportEmails}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#0F172A',
              borderColor: '#CBD5E1',
              fontWeight: '600',
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
              '&:disabled': { color: '#94A3B8', borderColor: '#E2E8F0' },
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: 'none',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            📥 Exportar E-mails
          </Button>

          <Button
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#3B82F6', 
              color: '#FFFFFF', 
              fontWeight: '600',
              '&:hover': { bgcolor: '#2563EB' },
              '&:disabled': { bgcolor: '#94A3B8' },
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              width: { xs: '100%', sm: 'auto' }
            }}
            onClick={() => router.push('/dashboard/admin/usuarios/novo')}
          >
            ➕ Novo Usuário
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', mr: 2, fontSize: '20px', width: 48, height: 48 }}>
                  👥
                </Avatar>
                <Box>
                  <Typography color="#64748B" variant="body2" sx={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    Total de Usuários
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: '700', fontSize: '1.75rem' }}>
                    {users.length}
                  </Typography>
                  {filtersActive && (
                    <Typography variant="body2" sx={{ color: '#3B82F6', fontSize: '0.85rem', fontWeight: 600 }}>
                      Filtrados: {filteredUsers.length}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', mr: 2, fontSize: '20px', width: 48, height: 48 }}>
                  📈
                </Avatar>
                <Box>
                  <Typography color="#64748B" variant="body2" sx={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    Usuários Ativos
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: '700', fontSize: '1.75rem' }}>
                    {users.filter(u => u.status === 'ACTIVE').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FAF5FF', color: '#7C3AED', mr: 2, fontSize: '20px', width: 48, height: 48 }}>
                  📅
                </Avatar>
                <Box>
                  <Typography color="#64748B" variant="body2" sx={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    Este Mês
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: '700', fontSize: '1.75rem' }}>
                    {users.filter(u => {
                      try {
                        return new Date(u.createdAt).getMonth() === new Date().getMonth();
                      } catch {
                        return false;
                      }
                    }).length}
                  </Typography>
                  {lastUpdatedAt && (
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 1 }}>
                      Atualizado em {lastUpdatedAt.toLocaleTimeString('pt-BR')}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de Usuários */}
      <Card sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0', py: 2 }}>
                  Usuário
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0', py: 2 }}>
                  Plano
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0', py: 2 }}>
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    color: '#475569',
                    fontWeight: '600',
                    borderBottom: '1px solid #E2E8F0',
                    py: 2,
                    display: { xs: 'none', lg: 'table-cell' }
                  }}
                >
                  Origem
                </TableCell>
                <TableCell
                  sx={{
                    color: '#475569',
                    fontWeight: '600',
                    borderBottom: '1px solid #E2E8F0',
                    py: 2,
                    display: { xs: 'none', md: 'table-cell' }
                  }}
                >
                  Criado em
                </TableCell>
                <TableCell
                  sx={{
                    color: '#475569',
                    fontWeight: '600',
                    borderBottom: '1px solid #E2E8F0',
                    py: 2,
                    display: { xs: 'none', md: 'table-cell' }
                  }}
                >
                  Último Login
                </TableCell>
                <TableCell
                  sx={{
                    color: '#475569',
                    fontWeight: '600',
                    borderBottom: '1px solid #E2E8F0',
                    py: 2,
                    display: { xs: 'none', md: 'table-cell' }
                  }}
                >
                  Compras
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0', py: 2 }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => {
                const planInfo = getPlanInfo(user.plan);
                const expired = isExpired(user.expirationDate);
                
                return (
                  <TableRow key={user.id} hover sx={{ 
                    '&:hover': { backgroundColor: '#F8FAFC' },
                    borderBottom: '1px solid #F1F5F9'
                  }}>
                    <TableCell sx={{ borderBottom: '1px solid #F1F5F9', py: 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ 
                          mr: 2, 
                          backgroundColor: expired ? '#FEE2E2' : '#EFF6FF',
                          color: expired ? '#DC2626' : '#3B82F6',
                          fontWeight: '600',
                          width: 40,
                          height: 40
                        }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: '500', fontSize: '0.9rem' }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                            {user.email}
                          </Typography>
                          {user.expirationDate && (
                            <Typography variant="caption" sx={{ 
                              color: expired ? '#DC2626' : '#D97706',
                              fontSize: '0.75rem'
                            }}>
                              {expired ? '🔴 Expirado' : '⏰ Expira'}: {formatDate(user.expirationDate)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #F1F5F9', py: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span style={{ fontSize: '16px' }}>{planInfo.emoji}</span>
                        <Chip
                          label={planInfo.label}
                          size="small"
                          sx={{ 
                            backgroundColor: `${planInfo.color}10`,
                            color: planInfo.color,
                            border: `1px solid ${planInfo.color}20`,
                            fontWeight: '500',
                            fontSize: '0.75rem'
                          }}
                        />
                        {user.plan === 'LITE_V2' && (
                          <Chip
                            label="NOVO"
                            size="small"
                            sx={{
                              backgroundColor: '#1d4ed8',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '10px',
                              height: '18px'
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #F1F5F9', py: 2 }}>
                      <Chip
                        label={user.status}
                        size="small"
                        color={getStatusColor(user.status) as any}
                        sx={{ fontWeight: '500', fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#64748B',
                        borderBottom: '1px solid #F1F5F9',
                        py: 2,
                        fontSize: '0.875rem',
                        display: { xs: 'none', lg: 'table-cell' }
                      }}
                    >
                      {user.origin}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#64748B',
                        borderBottom: '1px solid #F1F5F9',
                        py: 2,
                        fontSize: '0.875rem',
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#64748B',
                        borderBottom: '1px solid #F1F5F9',
                        py: 2,
                        fontSize: '0.875rem',
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#64748B',
                        borderBottom: '1px solid #F1F5F9',
                        py: 2,
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: '500', color: '#1E293B', fontSize: '0.875rem' }}>
                          {formatCurrency(user.totalPurchases)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                          {user.purchaseCount} compras
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #F1F5F9', py: 2 }}>
                      <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user.id)}
                          sx={{ 
                            color: '#3B82F6',
                            backgroundColor: '#EFF6FF',
                            '&:hover': { backgroundColor: '#DBEAFE' },
                            width: 32,
                            height: 32
                          }}
                          title="Editar usuário"
                        >
                          ✏️
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          sx={{ 
                            color: '#DC2626',
                            backgroundColor: '#FEF2F2',
                            '&:hover': { backgroundColor: '#FEE2E2' },
                            width: 32,
                            height: 32
                          }}
                          title="Excluir usuário"
                        >
                          🗑️
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredUsers.length === 0 && !loading && (
          <Box p={4} textAlign="center">
            <Typography sx={{ color: '#64748B' }}>
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </Typography>
          </Box>
        )}

      </Card>
    </Box>
  );
}
