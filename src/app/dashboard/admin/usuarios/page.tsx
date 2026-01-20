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
  plan: 'VIP' | 'LITE' | 'LITE_V2' | 'RENDA_PASSIVA' | 'FIIS' | 'RENDA_TURBINADA' | 'RENDA_TURBINADA_T2' | 'RENDA_TURBINADA_T3' | 'AMERICA' | 'ANALISTA' | 'ADMIN'; // ✅ ADICIONADO LITE_V2
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  hotmartCustomerId?: string;
  createdAt: string;
  lastLogin?: string;
  totalPurchases: number;
  purchaseCount: number;
  expirationDate?: string;
  origin: 'MANUAL' | 'HOTMART' | 'KIWIFY' | 'EDUZZ';
}

export default function AdminUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [originFilter, setOriginFilter] = React.useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);
  const refreshIntervalMs = 30000;

  // Verificar se é admin
  React.useEffect(() => {
    if (user && 'plan' in user && user.plan !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  React.useEffect(() => {
    loadUsers(true);
    const interval = window.setInterval(() => {
      loadUsers(false);
    }, refreshIntervalMs);
    return () => window.clearInterval(interval);
  }, []);

  const loadUsers = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }
      setError(null);
      
      console.log('🔄 Iniciando carregamento de usuários...');

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Verificar se a resposta é realmente JSON
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
      console.log('✅ Dados recebidos:', {
        success: data.success,
        usersCount: data.users?.length || 0,
        total: data.total
      });
      
      const nextUsers = data.users || [];
      setUsers(nextUsers);
      setLastUpdatedAt(new Date());
      setError(null);
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      
      // Mensagens de erro mais específicas
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
      
      setError(errorMessage);
    } finally {
      if (reset) {
        setLoading(false);
      }
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

      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('✅ Usuário excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert(`❌ Erro ao excluir usuário: ${error.message}`);
    }
  };

  // ✅ FUNÇÃO ATUALIZADA COM LITE_V2
  const getPlanInfo = (plan: string) => {
    const planMap = {
      'VIP': { label: 'Close Friends VIP', color: '#7C3AED', emoji: '👑' },
      'LITE': { label: 'Close Friends LITE', color: '#2563EB', emoji: '⭐' },
      'LITE_V2': { label: 'Close Friends LITE 2.0', color: '#1d4ed8', emoji: '⭐' }, // ✅ ADICIONADO
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

  // ✅ STATS ATUALIZADAS INCLUINDO LITE_V2
  const planStats = React.useMemo(() => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      byPlan: {
        VIP: users.filter(u => u.plan === 'VIP').length,
        LITE: users.filter(u => u.plan === 'LITE').length,
        LITE_V2: users.filter(u => u.plan === 'LITE_V2').length, // ✅ ADICIONADO
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

  // Debug info para desenvolvimento
  const debugInfo = React.useMemo(() => {
    const userEmail = localStorage.getItem('user-email');

    return {
      userEmail,
      currentUser: user,
      usersCount: users.length,
      planStats: planStats.byPlan,
      apiUrl: '/api/admin/users'
    };
  }, [user, users.length, planStats]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" sx={{ backgroundColor: '#F8FAFC' }}>
        <CircularProgress size={40} sx={{ color: '#3B82F6', mb: 2 }} />
        <Typography sx={{ color: '#64748B' }}>🔄 Carregando usuários...</Typography>
        
        {/* Debug info em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <Box mt={3} p={2} sx={{ backgroundColor: '#FFF3CD', borderRadius: 2, maxWidth: 500 }}>
            <Typography variant="caption" sx={{ color: '#856404' }}>
              Debug: {JSON.stringify(debugInfo, null, 2)}
            </Typography>
          </Box>
        )}
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

      {/* Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            backgroundColor: '#EBF8FF', 
            border: '1px solid #BEE3F8',
            color: '#2A69AC'
          }}
        >
          <Typography variant="caption">
            Debug Info: API: {debugInfo.apiUrl} | Token: {debugInfo.hasToken ? '✅' : '❌'} | Email: {debugInfo.userEmail || 'N/A'} | Users: {debugInfo.usersCount}
            <br />
            Planos: VIP({planStats.byPlan.VIP}) LITE({planStats.byPlan.LITE}) LITE_V2({planStats.byPlan.LITE_V2}) FIIS({planStats.byPlan.FIIS}) RENDA_TURBINADA({planStats.byPlan.RENDA_TURBINADA}) RENDA_TURBINADA_T2({planStats.byPlan.RENDA_TURBINADA_T2}) RENDA_TURBINADA_T3({planStats.byPlan.RENDA_TURBINADA_T3})
          </Typography>
        </Alert>
      )}

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
            <Button color="inherit" size="small" onClick={loadUsers} disabled={loading}>
              Tentar Novamente
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {error}
          </Typography>
          
          {/* Sugestões de solução */}
          <Box mt={2}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
              Possíveis soluções:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
              • Verifique se a API `/api/admin/users` está funcionando
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
              • Confirme se você está logado como administrador
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
              • Verifique a conexão com o banco de dados
            </Typography>
          </Box>
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
                        {/* ✅ BADGE ESPECIAL PARA LITE_V2 */}
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
                        {user.plan === 'RENDA_TURBINADA' && (
                          <Chip
                            label="CF Renda Turbinada"
                            size="small"
                            sx={{
                              backgroundColor: '#F97316',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '10px',
                              height: '18px'
                            }}
                          />
                        )}
                        {user.plan === 'RENDA_TURBINADA_T2' && (
                          <Chip
                            label="CF Renda Turbinada - Turma 2"
                            size="small"
                            sx={{
                              backgroundColor: '#FB923C',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '10px',
                              height: '18px'
                            }}
                          />
                        )}
                        {user.plan === 'RENDA_TURBINADA_T3' && (
                          <Chip
                            label="CF Renda Turbinada - Turma 3"
                            size="small"
                            sx={{
                              backgroundColor: '#FDBA74',
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
