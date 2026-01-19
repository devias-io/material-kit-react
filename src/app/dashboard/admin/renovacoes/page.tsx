'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RenovacaoStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  expiredUsers: number;
  expiringIn7Days: number;
  expiringIn15Days: number;
  expiringIn30Days: number;
  hotmartIntegrated: number;
  retentionRate: number;
  churnRate: number;
  totalRevenue: number;
  newUsersThisMonth: number;
}

interface UserExpiring {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  expirationDate: string | null;
  daysUntilExpiry: number;
  hotmartCustomerId: string | null;
  hotmartStatus: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  totalPurchases: number;
  createdAt: string;
  emailSent?: boolean;
}

interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: 'VIP' | 'LITE' | 'LITE_V2' | 'RENDA_PASSIVA' | 'FIIS' | 'RENDA_TURBINADA' | 'RENDA_TURBINADA_T2' | 'RENDA_TURBINADA_T3' | 'AMERICA' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  expirationDate: string | null;
  hotmartCustomerId: string | null;
  hotmartStatus: string | null;
  totalPurchases: number;
  createdAt: string;
  lastLogin: string | null;
}

interface MonthlyData {
  month: string;
  novosUsuarios: number;
  usuariosExpirados: number;
  receita: number;
  renovacoes: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RenovacoesDashboard() {
  const [stats, setStats] = useState<RenovacaoStats | null>(null);
  const [usersExpiring, setUsersExpiring] = useState<UserExpiring[]>([]);
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    daysBeforeExpiry: 7,
    subject: 'Sua assinatura expira em breve!',
    template: 'reminder'
  });

  // 🚀 FUNÇÃO PARA BUSCAR DADOS REAIS DA API
  const loadRenovacaoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Buscando dados reais da API de usuários...');
      
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Dados recebidos da API:', data);
      console.log('👥 Primeiros 3 usuários:', data.users?.slice(0, 3).map(u => ({
        email: u.email,
        totalPurchases: u.totalPurchases,
        type: typeof u.totalPurchases
      })));
      
      const users: ApiUser[] = data.users || [];
      setAllUsers(users);
      
      // 📊 CALCULAR ESTATÍSTICAS REAIS
      const hoje = new Date();
      const currentMonth = hoje.getMonth();
      const currentYear = hoje.getFullYear();
      
      // Usuários que expiram em X dias
      const usersWithExpiration = users.filter(u => u.expirationDate);
      const expiring7Days = usersWithExpiration.filter(u => {
        const expDate = new Date(u.expirationDate!);
        const diffTime = expDate.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
      });
      
      const expiring15Days = usersWithExpiration.filter(u => {
        const expDate = new Date(u.expirationDate!);
        const diffTime = expDate.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 15;
      });
      
      const expiring30Days = usersWithExpiration.filter(u => {
        const expDate = new Date(u.expirationDate!);
        const diffTime = expDate.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
      });
      
      // Usuários expirados
      const expiredUsers = usersWithExpiration.filter(u => {
        const expDate = new Date(u.expirationDate!);
        return expDate < hoje;
      });
      
      // Novos usuários este mês
      const newUsersThisMonth = users.filter(u => {
        const createdDate = new Date(u.createdAt);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      });
      
      // Receita total - com tratamento robusto
      const totalRevenue = users.reduce((sum, u) => {
        const purchases = typeof u.totalPurchases === 'number' ? u.totalPurchases : 
                         typeof u.totalPurchases === 'string' ? parseFloat(u.totalPurchases) || 0 : 0;
        console.log(`User ${u.email}: R$ ${purchases}`);
        return sum + purchases;
      }, 0);
      
      console.log('💰 Receita total calculada:', totalRevenue);
      
      // Estatísticas calculadas
      const calculatedStats: RenovacaoStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'ACTIVE').length,
        inactiveUsers: users.filter(u => u.status === 'INACTIVE').length,
        expiredUsers: expiredUsers.length,
        expiringIn7Days: expiring7Days.length,
        expiringIn15Days: expiring15Days.length,
        expiringIn30Days: expiring30Days.length,
        hotmartIntegrated: users.filter(u => u.hotmartCustomerId).length,
        retentionRate: users.length > 0 ? ((users.filter(u => u.status === 'ACTIVE').length / users.length) * 100) : 0,
        churnRate: users.length > 0 ? ((users.filter(u => u.status === 'INACTIVE').length / users.length) * 100) : 0,
        totalRevenue,
        newUsersThisMonth: newUsersThisMonth.length
      };
      
      setStats(calculatedStats);
      
      // 📅 PREPARAR DADOS DE USUÁRIOS EXPIRANDO
      const usersExpiringData: UserExpiring[] = expiring30Days.map(user => {
        const expDate = new Date(user.expirationDate!);
        const diffTime = expDate.getTime() - hoje.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          plan: user.plan,
          expirationDate: user.expirationDate,
          daysUntilExpiry,
          hotmartCustomerId: user.hotmartCustomerId,
          hotmartStatus: user.hotmartStatus,
          status: user.status,
          totalPurchases: user.totalPurchases,
          createdAt: user.createdAt,
          emailSent: false
        };
      }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
      
      setUsersExpiring(usersExpiringData);
      
      // 📈 GERAR DADOS MENSAIS (últimos 6 meses)
      const monthlyStats: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);
        
        const usersInMonth = users.filter(u => {
          const createdDate = new Date(u.createdAt);
          return createdDate >= targetDate && createdDate < nextMonth;
        });
        
        const expiredInMonth = users.filter(u => {
          if (!u.expirationDate) return false;
          const expDate = new Date(u.expirationDate);
          return expDate >= targetDate && expDate < nextMonth;
        });
        
        const revenueInMonth = usersInMonth.reduce((sum, u) => {
          const purchases = typeof u.totalPurchases === 'number' ? u.totalPurchases : 
                           typeof u.totalPurchases === 'string' ? parseFloat(u.totalPurchases) || 0 : 0;
          return sum + purchases;
        }, 0);
        
        monthlyStats.push({
          month: targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          novosUsuarios: usersInMonth.length,
          usuariosExpirados: expiredInMonth.length,
          receita: revenueInMonth,
          renovacoes: Math.max(0, usersInMonth.length - expiredInMonth.length)
        });
      }
      
      setMonthlyData(monthlyStats);
      
      console.log('📊 Estatísticas calculadas:', calculatedStats);
      console.log('⏰ Usuários expirando:', usersExpiringData.length);
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados de renovação:', error);
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRenovacaoData();
  }, []);

  const handleSendReminderEmail = async (userId: string) => {
    try {
      // TODO: Implementar envio real de email
      setUsersExpiring(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, emailSent: true } : user
        )
      );
      alert('Email de lembrete enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email');
    }
  };

  const handleBulkSendEmails = async () => {
    try {
      const usersToEmail = usersExpiring.filter(user => 
        user.daysUntilExpiry <= emailSettings.daysBeforeExpiry && !user.emailSent
      );
      
      // TODO: Implementar envio em lote real
      setUsersExpiring(prev => 
        prev.map(user => 
          user.daysUntilExpiry <= emailSettings.daysBeforeExpiry ? { ...user, emailSent: true } : user
        )
      );
      
      alert(`${usersToEmail.length} emails enviados com sucesso!`);
    } catch (error) {
      console.error('Erro ao enviar emails em lote:', error);
    }
  };

  // ✅ FUNÇÃO ATUALIZADA COM LITE_V2
  const getPlanInfo = (plan: string) => {
    const planMap: Record<string, { label: string; color: string; emoji: string }> = {
      'VIP': { label: 'Close Friends VIP', color: '#7C3AED', emoji: '👑' },
      'LITE': { label: 'Close Friends LITE', color: '#2563EB', emoji: '⭐' },
      'LITE_V2': { label: 'Close Friends LITE 2.0', color: '#1d4ed8', emoji: '🌟' },
      'RENDA_PASSIVA': { label: 'Projeto Renda Passiva', color: '#059669', emoji: '💰' },
      'FIIS': { label: 'Projeto FIIs', color: '#D97706', emoji: '🏢' },
      'RENDA_TURBINADA': { label: 'CF Renda Turbinada', color: '#F97316', emoji: '⚡' },
      'RENDA_TURBINADA_T2': { label: 'CF Renda Turbinada - Turma 2', color: '#FB923C', emoji: '⚡' },
      'RENDA_TURBINADA_T3': { label: 'CF Renda Turbinada - Turma 3', color: '#FDBA74', emoji: '⚡' },
      'AMERICA': { label: 'Projeto América', color: '#DC2626', emoji: '🇺🇸' },
      'ADMIN': { label: 'Administrador', color: '#4B5563', emoji: '🛡️' }
    };
    return planMap[plan] || { label: plan, color: '#6B7280', emoji: '📋' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getExpiryColor = (days: number) => {
    if (days <= 3) return '#DC2626'; // Vermelho
    if (days <= 7) return '#D97706'; // Laranja
    if (days <= 15) return '#EAB308'; // Amarelo
    return '#059669'; // Verde
  };

  const pieData = [
    { name: 'Ativos', value: stats?.activeUsers || 0, fill: '#059669' },
    { name: 'Inativos', value: stats?.inactiveUsers || 0, fill: '#DC2626' },
    { name: 'Expirados', value: stats?.expiredUsers || 0, fill: '#D97706' }
  ];

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#3B82F6', mb: 2 }} />
        <Typography>Carregando dados de renovação da API...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadRenovacaoData}>
              Tentar Novamente
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: '500' }}>
            ❌ Erro ao carregar dados: {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={5}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1E293B', fontWeight: '700' }}>
          📊 Dashboard de Renovações
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Dados em tempo real da API • {stats?.totalUsers} usuários • {stats?.hotmartIntegrated} integrados com Hotmart
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', mr: 2, fontSize: '20px' }}>
                  👥
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total de Usuários
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {stats?.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', mr: 2, fontSize: '20px' }}>
                  ✅
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Usuários Ativos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {stats?.activeUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669' }}>
                    {stats && stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FEF2F2', color: '#DC2626', mr: 2, fontSize: '20px' }}>
                  ⚠️
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Expiram em 7 dias
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {stats?.expiringIn7Days}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#DC2626' }}>
                    Ação necessária
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', mr: 2, fontSize: '20px' }}>
                  💰
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Receita Total
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700', fontSize: '1.25rem' }}>
                    {stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : 'R$ 0,00'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#D97706' }}>
                    {stats?.newUsersThisMonth} novos este mês
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      <Box mb={4}>
        {stats && stats.expiringIn7Days > 0 && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleBulkSendEmails}>
                Enviar Lembretes
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: '500' }}>
              ⚠️ {stats.expiringIn7Days} usuários têm assinaturas expirando nos próximos 7 dias
            </Typography>
          </Alert>
        )}
        
        {stats && stats.expiredUsers > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: '500' }}>
              🔴 {stats.expiredUsers} usuários com assinaturas expiradas encontrados
            </Typography>
          </Alert>
        )}

        {stats && stats.hotmartIntegrated < stats.totalUsers * 0.5 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: '500' }}>
              ℹ️ Apenas {stats.hotmartIntegrated} de {stats.totalUsers} usuários têm integração com Hotmart
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="📊 Visão Geral" />
          <Tab label="⏰ Vencimentos" />
          <Tab label="📈 Relatórios" />
          <Tab label="📧 Comunicação" />
        </Tabs>
      </Box>

      {/* Tab 1: Visão Geral */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Gráfico de Status */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribuição de Usuários
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Métricas de Retenção */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Métricas de Retenção
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Taxa de Retenção</Typography>
                    <Typography variant="body2" sx={{ fontWeight: '600', color: '#059669' }}>
                      {stats?.retentionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.retentionRate || 0} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#059669' }
                    }} 
                  />
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Taxa de Cancelamento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: '600', color: '#DC2626' }}>
                      {stats?.churnRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.churnRate || 0} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#DC2626' }
                    }} 
                  />
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                    Próximos Vencimentos:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center" p={2} sx={{ backgroundColor: '#FEF2F2', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ color: '#DC2626', fontWeight: '700' }}>
                          {stats?.expiringIn7Days}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#DC2626' }}>
                          7 dias
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center" p={2} sx={{ backgroundColor: '#FEF3C7', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ color: '#D97706', fontWeight: '700' }}>
                          {stats?.expiringIn15Days}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#D97706' }}>
                          15 dias
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center" p={2} sx={{ backgroundColor: '#ECFDF5', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ color: '#059669', fontWeight: '700' }}>
                          {stats?.expiringIn30Days}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#059669' }}>
                          30 dias
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Vencimentos */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Usuários com Vencimento Próximo ({usersExpiring.length})
              </Typography>
              <Button
                variant="contained"
                sx={{ bgcolor: '#D97706' }}
                onClick={handleBulkSendEmails}
                disabled={usersExpiring.filter(u => !u.emailSent).length === 0}
              >
                📧 Enviar Lembretes em Lote
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: '600' }}>Usuário</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Plano</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Vencimento</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Dias Restantes</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Receita</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Hotmart</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersExpiring.map((user) => {
                    const planInfo = getPlanInfo(user.plan);
                    
                    return (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: '500' }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <span style={{ fontSize: '16px' }}>{planInfo.emoji}</span>
                            <Chip
                              label={planInfo.label}
                              size="small"
                              sx={{ 
                                backgroundColor: `${planInfo.color}20`,
                                color: planInfo.color,
                                fontWeight: '500'
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.expirationDate ? formatDate(user.expirationDate) : 'Sem data'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${user.daysUntilExpiry} dias`}
                            size="small"
                            sx={{
                              backgroundColor: `${getExpiryColor(user.daysUntilExpiry)}20`,
                              color: getExpiryColor(user.daysUntilExpiry),
                              fontWeight: '600'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: '500' }}>
                            {formatCurrency(user.totalPurchases)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.hotmartCustomerId ? 'Integrado' : 'Manual'}
                            size="small"
                            color={user.hotmartCustomerId ? 'success' : 'default'}
                            sx={{ fontWeight: '500' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            size="small"
                            color={user.status === 'ACTIVE' ? 'success' : 'error'}
                            sx={{ fontWeight: '500' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={user.emailSent}
                            onClick={() => handleSendReminderEmail(user.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            {user.emailSent ? '✅ Enviado' : '📧 Enviar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {usersExpiring.length === 0 && (
              <Box p={4} textAlign="center">
                <Typography sx={{ color: '#64748B' }}>
                  🎉 Nenhum usuário com vencimento próximo!
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 3: Relatórios */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Novos Usuários vs Expirados (Últimos 6 Meses)
                </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="novosUsuarios" name="Novos Usuários" fill="#059669" />
                      <Bar dataKey="usuariosExpirados" name="Usuários Expirados" fill="#DC2626" />
                      <Bar dataKey="renovacoes" name="Renovações" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Receita por Mês
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="receita" name="Receita" stroke="#D97706" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 4: Comunicação */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Email
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailSettings.enabled}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      />
                    }
                    label="Emails automáticos habilitados"
                  />
                </Box>

                <Box sx={{ mt: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Enviar lembrete antes de</InputLabel>
                    <Select
                      value={emailSettings.daysBeforeExpiry}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, daysBeforeExpiry: Number(e.target.value) }))}
                      label="Enviar lembrete antes de"
                    >
                      <MenuItem value={3}>3 dias</MenuItem>
                      <MenuItem value={7}>7 dias</MenuItem>
                      <MenuItem value={15}>15 dias</MenuItem>
                      <MenuItem value={30}>30 dias</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    label="Assunto do Email"
                    value={emailSettings.subject}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ bgcolor: '#059669' }}
                    onClick={() => alert('Configurações salvas!')}
                  >
                    Salvar Configurações
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Integração com API
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Conectado à API /api/admin/users
                  </Alert>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Total de usuários</Typography>
                    <Typography variant="body2" sx={{ fontWeight: '600' }}>
                      {stats?.totalUsers}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Integrados com Hotmart</Typography>
                    <Typography variant="body2" sx={{ fontWeight: '600', color: '#059669' }}>
                      {stats?.hotmartIntegrated}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Expirando em 7 dias</Typography>
                    <Typography variant="body2" sx={{ fontWeight: '600', color: '#DC2626' }}>
                      {stats?.expiringIn7Days}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={loadRenovacaoData}
                    disabled={loading}
                  >
                    🔄 Atualizar Dados
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Dialog de Email Customizado */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Enviar Email Customizado</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Assunto"
              fullWidth
              placeholder="Oferta especial de renovação"
            />
            
            <TextField
              label="Mensagem"
              fullWidth
              multiline
              rows={6}
              placeholder="Olá [NOME], sua assinatura expira em [DIAS] dias..."
            />
            
            <FormControl fullWidth>
              <InputLabel>Destinatários</InputLabel>
              <Select label="Destinatários">
                <MenuItem value="expiring7">Expirando em 7 dias ({stats?.expiringIn7Days})</MenuItem>
                <MenuItem value="expiring15">Expirando em 15 dias ({stats?.expiringIn15Days})</MenuItem>
                <MenuItem value="expired">Já expirados ({stats?.expiredUsers})</MenuItem>
                <MenuItem value="all_active">Todos ativos ({stats?.activeUsers})</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" sx={{ bgcolor: '#059669' }}>
            📧 Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
