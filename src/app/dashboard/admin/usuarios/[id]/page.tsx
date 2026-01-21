'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  Avatar,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import { useUser } from '@/hooks/use-user';
import { PLAN_PERMISSIONS } from '@/lib/permissions';
import { isLifetimePlan } from '@/lib/lifetime-plans';
import { useRouter, useParams } from 'next/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  plan: 'VIP' | 'LITE' | 'LITE_V2' | 'RENDA_PASSIVA' | 'FIIS' | 'RENDA_TURBINADA' | 'RENDA_TURBINADA_T2' | 'RENDA_TURBINADA_T3' | 'AMERICA' | 'ANALISTA' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  hotmartCustomerId?: string;
  phone?: string | null;
  hotmartPhone?: string | null;
  kiwifyPhone?: string | null;
  eduzzPhone?: string | null;
  createdAt: string;
  lastLogin?: string;
  totalPurchases: number;
  purchaseCount: number;
  expirationDate?: string | null;
  customPermissions?: string[];
  origin: 'MANUAL' | 'HOTMART' | 'KIWIFY' | 'EDUZZ';
  entitlements?: Array<{
    id: string;
    code: string;
    status: string;
    expiresAt?: string | null;
    origin?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  activeEntitlements?: string[];
}

interface Purchase {
  id: string;
  amount: number;
  date: string;
  product: string;
  status: string;
}

interface MigrationSimulation {
  fromPlan: string;
  toPlan: string;
  totalPaid: number;
  installmentsTotal: number | null;
  installmentsPaid: number | null;
  platform: string | null;
  productExternalId: string | null;
  productName: string | null;
  monthsRemaining: number;
  monthsUsed: number;
  monthlyValue: number;
  credit: number;
  vipPrice: number;
  finalPrice: number;
  notices: string[];
  purchaseDate: string;
  expirationDate: string | null;
}

export default function EditUserPage() {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [migrationSimulation, setMigrationSimulation] = React.useState<MigrationSimulation | null>(null);
  const [migrationLoading, setMigrationLoading] = React.useState(false);
  const [migrationError, setMigrationError] = React.useState<string | null>(null);
  const [migrationDialogOpen, setMigrationDialogOpen] = React.useState(false);
  const [migrationLink, setMigrationLink] = React.useState<string | null>(null);
  const [migrationLinkLoading, setMigrationLinkLoading] = React.useState(false);
  const previousExpirationDateRef = React.useRef<string | null>(null);

  // Lista de conteúdos disponíveis para liberação
  const availableContents = [
    { id: 'small-caps', label: 'Small Caps', category: 'Principal' },
    { id: 'micro-caps', label: 'Micro Caps', category: 'Principal' },
    { id: 'dividendos', label: 'Dividendos', category: 'Principal' },
    { id: 'fundos-imobiliarios', label: 'Fundos Imobiliários', category: 'Principal' },
    { id: 'rentabilidades', label: 'Rentabilidades', category: 'Principal' },

    { id: 'cf-renda-turbinada', label: 'CF Renda Turbinada', category: 'CF Renda Turbinada' },
    { id: 'cf-renda-turbinada-aulas', label: 'CF Renda Turbinada • Aulas', category: 'CF Renda Turbinada' },
    { id: 'cf-renda-turbinada-bastidores', label: 'CF Renda Turbinada • Bastidores da Bolsa', category: 'CF Renda Turbinada' },
    { id: 'cf-renda-turbinada-carteira', label: 'CF Renda Turbinada • Carteira Recomendada', category: 'CF Renda Turbinada' },

    { id: 'internacional-etfs', label: 'ETFs Internacionais', category: 'Internacional' },
    { id: 'internacional-stocks', label: 'Stocks', category: 'Internacional' },
    { id: 'internacional-dividendos', label: 'Dividendos Internacionais', category: 'Internacional' },
    { id: 'internacional-projeto-america', label: 'Projeto América', category: 'Internacional' },
    
    { id: 'recursos-dicas', label: 'Dicas de Investimentos', category: 'Recursos Exclusivos' },
    { id: 'recursos-analise', label: 'Análise de Carteira', category: 'Recursos Exclusivos' },
    { id: 'recursos-ebooks', label: 'E-books', category: 'Recursos Exclusivos' },
    { id: 'recursos-imposto', label: 'Imposto de Renda', category: 'Recursos Exclusivos' },
    { id: 'recursos-lives', label: 'Lives e Aulas', category: 'Recursos Exclusivos' },
    { id: 'recursos-milhas', label: 'Milhas Aéreas', category: 'Recursos Exclusivos' },
    { id: 'recursos-planilhas', label: 'Planilhas', category: 'Recursos Exclusivos' },
    { id: 'recursos-telegram', label: 'Telegram', category: 'Recursos Exclusivos' },
    // Administrativos
    { id: 'admin', label: 'Painel Administrativo', category: 'Administrativo' },
    { id: 'admin-dashboard', label: 'Dashboard Admin', category: 'Administrativo' },
    { id: 'admin-usuarios', label: 'Gestão de Usuários (Admin)', category: 'Administrativo' },
    { id: 'admin-instagram', label: 'Instagram Close Friends (Admin)', category: 'Administrativo' },
    { id: 'admin-integracoes', label: 'Integrações (Admin)', category: 'Administrativo' },
    { id: 'admin-renovacoes', label: 'Renovações (Admin)', category: 'Administrativo' },
    { id: 'admin-empresas', label: 'Gestão de Empresas (Admin)', category: 'Administrativo' },
    { id: 'admin-proventos', label: 'Central de Proventos (Admin)', category: 'Administrativo' },
    { id: 'admin-relatorios', label: 'Gestão de Relatórios (Admin)', category: 'Administrativo' },
    { id: 'admin-relatorio-semanal', label: 'Relatório Semanal (Admin)', category: 'Administrativo' },
    { id: 'admin-analises-trimesestrais', label: 'Análises Trimestrais (Admin)', category: 'Administrativo' },
    { id: 'admin-analise-tecnica', label: 'Análises Técnicas (Admin)', category: 'Administrativo' },
    { id: 'admin-carteiras', label: 'Analisar Carteiras (Admin)', category: 'Administrativo' },
    { id: 'admin-settings', label: 'Configurações (Admin)', category: 'Administrativo' },
    { id: 'admin-central-duvidas', label: 'Central de Dúvidas (Admin)', category: 'Administrativo' }
  ];

  const normalizePermissionId = (permissionId: string): string => {
    if (permissionId === 'projeto-america') {
      return 'internacional-projeto-america';
    }

    return permissionId;
  };

  const getArrayPermissions = (value: unknown): string[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map(item => normalizePermissionId(String(item)));
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(item => normalizePermissionId(String(item)));
        }
      } catch (error) {
        if (value.trim().length > 0) {
          return [normalizePermissionId(value)];
        }
      }
    }

    return [];
  };

  // Verificar se é admin
  React.useEffect(() => {
    if (currentUser && 'plan' in currentUser && currentUser.plan !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  React.useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);

      console.log('🔍 Debug - Carregando usuário e compras:', userId);

      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('🔍 Debug - Error response:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
      
      const normalizedCustomPermissions = getArrayPermissions(data.user.customPermissions);
      const activeEntitlements = Array.isArray(data.user.activeEntitlements)
        ? data.user.activeEntitlements
        : [];

      setUser({
        ...data.user,
        customPermissions: normalizedCustomPermissions,
        activeEntitlements,
      });
      previousExpirationDateRef.current = data.user.expirationDate ?? null;
      setPurchases(data.purchases || []);
      setError(null);
      
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
      setError(`Erro ao carregar usuário: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar usuário');
      }

      alert('✅ Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }

      alert('✅ Usuário excluído com sucesso!');
      router.push('/dashboard/admin/usuarios');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro ao excluir usuário');
    }
  };

  const handleResendInstructions = async () => {
    if (!user) return;

    try {
      setResending(true);

      const response = await fetch(`/api/admin/users/${userId}/resend-instructions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao reenviar instruções');
      }

      const data = await response.json();
      alert(data.message || '✅ Instruções reenviadas com sucesso!');
    } catch (error) {
      console.error('Erro ao reenviar instruções:', error);
      alert('❌ Erro ao reenviar instruções de acesso');
    } finally {
      setResending(false);
    }
  };

  const handleMigrationSimulation = async () => {
    if (!user) return;

    try {
      setMigrationLoading(true);
      setMigrationError(null);
      setMigrationLink(null);

      const response = await fetch(`/api/admin/users/${userId}/migration-simulation?target=VIP`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao simular migração.');
      }

      setMigrationSimulation(data.simulation);
      setMigrationDialogOpen(true);
    } catch (error) {
      console.error('Erro ao simular migração:', error);
      setMigrationError(error instanceof Error ? error.message : 'Erro ao simular migração.');
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleGenerateMigrationLink = async () => {
    if (!user) return;

    try {
      setMigrationLinkLoading(true);
      setMigrationError(null);

      const response = await fetch(`/api/admin/users/${userId}/migration-link`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target: 'VIP' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao gerar link de migração.');
      }

      setMigrationLink(data.paymentUrl || null);
    } catch (error) {
      console.error('Erro ao gerar link de migração:', error);
      setMigrationError(error instanceof Error ? error.message : 'Erro ao gerar link de migração.');
    } finally {
      setMigrationLinkLoading(false);
    }
  };

  const handleCopyMigrationLink = async () => {
    if (!migrationLink) return;

    try {
      await navigator.clipboard.writeText(migrationLink);
      alert('✅ Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('❌ Não foi possível copiar o link');
    }
  };

  const handleLifetimeToggle = (checked: boolean) => {
    if (!user) return;

    if (isLifetimePlan(user.plan)) {
      setUser({ ...user, expirationDate: null });
      return;
    }

    if (checked) {
      if (user.expirationDate !== null) {
        previousExpirationDateRef.current = user.expirationDate ?? previousExpirationDateRef.current;
      }

      setUser({ ...user, expirationDate: null });
      return;
    }

    const previousExpiration = previousExpirationDateRef.current;
    setUser({ ...user, expirationDate: previousExpiration ?? undefined });
    previousExpirationDateRef.current = previousExpiration ?? null;
  };

  const handlePermissionChange = (contentId: string, checked: boolean) => {
    if (!user) return;

    const normalizedId = normalizePermissionId(contentId);
    const currentPermissions = getArrayPermissions(user.customPermissions);

    const newPermissions = checked
      ? Array.from(new Set([...currentPermissions, normalizedId]))
      : currentPermissions.filter(permission => normalizePermissionId(permission) !== normalizedId);

    setUser({ ...user, customPermissions: newPermissions });
  };

  // ✨ FUNÇÕES PARA PERMISSÕES - VERSÃO ÚNICA SEM DUPLICATAS
  const getPlanPermissions = (plan: string): string[] => {
    const planConfig = PLAN_PERMISSIONS[plan as keyof typeof PLAN_PERMISSIONS];

    if (!planConfig?.pages) {
      return [];
    }

    return planConfig.pages.map(normalizePermissionId);
  };

  const isPermissionFromPlan = (contentId: string): boolean => {
    if (!user) return false;

    const planPermissions = getPlanPermissions(user.plan);
    const normalizedId = normalizePermissionId(contentId);

    return planPermissions.includes(normalizedId);
  };

  const isCustomPermission = (contentId: string): boolean => {
    if (!user) return false;

    const customPermissions = getArrayPermissions(user.customPermissions);
    const normalizedId = normalizePermissionId(contentId);

    return customPermissions.includes(normalizedId);
  };

  const getEntitlementPermissions = (entitlements?: string[]): string[] => {
    if (!entitlements || entitlements.length === 0) {
      return [];
    }

    return entitlements.flatMap(code => {
      const entitlementConfig = PLAN_PERMISSIONS[code as keyof typeof PLAN_PERMISSIONS];
      return (entitlementConfig?.pages ?? []).map(normalizePermissionId);
    });
  };

  const isPermissionFromEntitlement = (contentId: string): boolean => {
    if (!user?.activeEntitlements?.length) {
      return false;
    }

    const normalizedId = normalizePermissionId(contentId);
    const entitlementPermissions = getEntitlementPermissions(user.activeEntitlements);

    return entitlementPermissions.includes(normalizedId);
  };

  const hasPermission = (contentId: string): boolean => {
    const normalizedId = normalizePermissionId(contentId);
    const customPermissions = getArrayPermissions(user?.customPermissions);

    return (
      isPermissionFromPlan(contentId) ||
      isPermissionFromEntitlement(contentId) ||
      customPermissions.includes(normalizedId)
    );
  };

  const planHasAdminAccess = user ? getPlanPermissions(user.plan).some(permission => permission.startsWith('admin')) : false;
  const customHasAdminAccess = user ? getArrayPermissions(user.customPermissions).some(permission => permission.startsWith('admin')) : false;
  const showAdminCategory = (user?.plan === 'ANALISTA' || user?.plan === 'ADMIN') || planHasAdminAccess || customHasAdminAccess;
  const contentCategories = showAdminCategory
    ? ['Principal', 'CF Renda Turbinada', 'Internacional', 'Recursos Exclusivos', 'Administrativo']
    : ['Principal', 'CF Renda Turbinada', 'Internacional', 'Recursos Exclusivos'];

  const getPlanInfo = (plan: string) => {
    const planMap = {
      'VIP': { label: 'Close Friends VIP', color: '#8B5CF6', emoji: '👑' },
      'LITE': { label: 'Close Friends LITE', color: '#3B82F6', emoji: '⭐' },
      'LITE_V2': { label: 'Close Friends LITE 2.0', color: '#1d4ed8', emoji: '🌟' },
      'RENDA_PASSIVA': { label: 'Projeto Renda Passiva', color: '#10B981', emoji: '💰' },
      'FIIS': { label: 'Projeto FIIs', color: '#F59E0B', emoji: '🏢' },
      'RENDA_TURBINADA': { label: 'CF Renda Turbinada', color: '#F97316', emoji: '⚡' },
      'RENDA_TURBINADA_T2': { label: 'CF Renda Turbinada - Turma 2', color: '#FB923C', emoji: '⚡' },
      'RENDA_TURBINADA_T3': { label: 'CF Renda Turbinada - Turma 3', color: '#FDBA74', emoji: '⚡' },
      'AMERICA': { label: 'Projeto América', color: '#EF4444', emoji: '🇺🇸' },
      'ANALISTA': { label: 'Analista', color: '#2563EB', emoji: '📊' },
      'ADMIN': { label: 'Administrador', color: '#6B7280', emoji: '🛡️' }
    };
    return planMap[plan as keyof typeof planMap] || { label: plan, color: '#9CA3AF', emoji: '📋' };
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isExpired = (expirationDate?: string | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" sx={{ backgroundColor: '#F8FAFC' }}>
        <Typography sx={{ color: '#64748B' }}>🔄 Carregando usuário...</Typography>
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box p={4} sx={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        <Alert 
          severity="error"
          sx={{ 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FECACA',
            color: '#991B1B',
            borderRadius: 2
          }}
        >
          {error || 'Usuário não encontrado'}
        </Alert>
        <Button 
          onClick={() => router.push('/dashboard/admin/usuarios')} 
          sx={{ 
            mt: 2, 
            color: '#3B82F6',
            '&:hover': { backgroundColor: '#EFF6FF' }
          }}
        >
          ← Voltar para lista
        </Button>
      </Box>
    );
  }

  const planInfo = getPlanInfo(user.plan);
  const lifetimePlan = isLifetimePlan(user.plan);
  const isLifetimeAccess = lifetimePlan || user.expirationDate === null;
  const expired = !isLifetimeAccess && isExpired(user.expirationDate);
  const isVipPlan = user.plan === 'VIP' || user.plan === 'ADMIN';
  const phoneValue = user.phone || user.hotmartPhone || user.kiwifyPhone || user.eduzzPhone || '';

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={5} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Button 
            onClick={() => router.push('/dashboard/admin/usuarios')}
            sx={{ 
              color: '#3B82F6', 
              mb: 2,
              '&:hover': { backgroundColor: '#EFF6FF' },
              fontWeight: '500'
            }}
          >
            ← Voltar para lista
          </Button>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1E293B', fontWeight: '700', fontSize: '2rem' }}>
            ✏️ Editar Usuário
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B', fontSize: '1rem' }}>
            Gerencie dados, permissões e acesso do usuário
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={handleResendInstructions}
            disabled={resending}
            sx={{
              color: '#3B82F6',
              borderColor: '#3B82F6',
              '&:hover': {
                backgroundColor: '#EFF6FF',
                borderColor: '#2563EB'
              },
              '&:disabled': {
                color: '#94A3B8',
                borderColor: '#94A3B8'
              },
              fontWeight: '500'
            }}
          >
            {resending ? '📨 Reenviando...' : '📧 Reenviar instruções'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowDeleteDialog(true)}
            sx={{
              color: '#EF4444',
              borderColor: '#EF4444',
              '&:hover': { 
                backgroundColor: '#FEF2F2',
                borderColor: '#DC2626'
              },
              fontWeight: '500'
            }}
          >
            🗑️ Excluir
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
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
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            {saving ? '💾 Salvando...' : '💾 Salvar'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informações Básicas */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1E293B', fontWeight: '600' }}>
                👤 Informações Básicas
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar 
                  sx={{ 
                    mr: 2, 
                    width: 60, 
                    height: 60,
                    backgroundColor: expired ? '#FEE2E2' : '#EFF6FF',
                    color: expired ? '#DC2626' : '#3B82F6',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: '600' }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{planInfo.emoji}</span>
                    <Chip
                      label={planInfo.label}
                      size="small"
                      sx={{ 
                        backgroundColor: `${planInfo.color}10`,
                        color: planInfo.color,
                        border: `1px solid ${planInfo.color}20`,
                        fontWeight: '500'
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={user.firstName}
                    onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                    sx={{ 
                      '& .MuiInputBase-input': { color: '#1E293B' },
                      '& .MuiInputLabel-root': { color: '#64748B' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Sobrenome"
                    value={user.lastName}
                    onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                    sx={{ 
                      '& .MuiInputBase-input': { color: '#1E293B' },
                      '& .MuiInputLabel-root': { color: '#64748B' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    sx={{
                      '& .MuiInputBase-input': { color: '#1E293B' },
                      '& .MuiInputLabel-root': { color: '#64748B' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Telefone (Hotmart/Kiwify/Eduzz)"
                    value={phoneValue}
                    InputProps={{ readOnly: true }}
                    helperText={phoneValue ? 'Número trazido das plataformas de pagamento ou cadastro interno' : 'Nenhum telefone disponível'}
                    sx={{
                      '& .MuiInputBase-input': { color: '#1E293B' },
                      '& .MuiInputLabel-root': { color: '#64748B' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#64748B' }}>Plano</InputLabel>
                    <Select
                      value={user.plan}
                      onChange={(e) => {
                        const selectedPlan = e.target.value as User['plan'];

                        setUser(prevUser => {
                          if (!prevUser) {
                            return prevUser;
                          }

                          const nextUser = { ...prevUser, plan: selectedPlan };

                          if (isLifetimePlan(selectedPlan)) {
                            previousExpirationDateRef.current = prevUser.expirationDate ?? previousExpirationDateRef.current;
                            nextUser.expirationDate = null;
                          }

                          return nextUser;
                        });
                      }}
                      sx={{
                        color: '#1E293B',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6', borderWidth: '2px' }
                      }}
                    >
                      <MenuItem value="VIP">👑 Close Friends VIP</MenuItem>
                      <MenuItem value="LITE">⭐ Close Friends LITE</MenuItem>
                      <MenuItem value="LITE_V2">🌟 Close Friends LITE 2.0</MenuItem>
                      <MenuItem value="RENDA_PASSIVA">💰 Projeto Renda Passiva</MenuItem>
                      <MenuItem value="FIIS">🏢 Projeto FIIs</MenuItem>
                      <MenuItem value="AMERICA">🇺🇸 Projeto América</MenuItem>
                      <MenuItem value="RENDA_TURBINADA">⚡ CF Renda Turbinada</MenuItem>
                      <MenuItem value="RENDA_TURBINADA_T2">⚡ CF Renda Turbinada - Turma 2</MenuItem>
                      <MenuItem value="RENDA_TURBINADA_T3">⚡ CF Renda Turbinada - Turma 3</MenuItem>
                      <MenuItem value="ANALISTA">📊 Analista</MenuItem>
                      <MenuItem value="ADMIN">🛡️ Administrador</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#64748B' }}>Status</InputLabel>
                    <Select
                      value={user.status}
                      onChange={(e) => setUser({ ...user, status: e.target.value as any })}
                      sx={{
                        color: '#1E293B',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6', borderWidth: '2px' }
                      }}
                    >
                      <MenuItem value="ACTIVE">✅ Ativo</MenuItem>
                      <MenuItem value="INACTIVE">❌ Inativo</MenuItem>
                      <MenuItem value="PENDING">⏳ Pendente</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Origem"
                    value={user.origin}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': { color: '#1E293B' },
                      '& .MuiInputLabel-root': { color: '#64748B' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isLifetimeAccess}
                        onChange={(e) => handleLifetimeToggle(e.target.checked)}
                        disabled={lifetimePlan}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#3B82F6' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3B82F6' }
                        }}
                      />
                    }
                    label={lifetimePlan ? 'Plano com acesso vitalício' : 'Marcar acesso vitalício'}
                    sx={{
                      mb: 1,
                      ml: 0,
                      '& .MuiFormControlLabel-label': { color: '#1E293B', fontWeight: 500 }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Data de Vencimento do Acesso"
                    type="date"
                    value={formatDate(user.expirationDate)}
                    onChange={(e) => {
                      const newValue = e.target.value;

                      if (newValue) {
                        previousExpirationDateRef.current = newValue;
                      }

                      setUser(prevUser => {
                        if (!prevUser) {
                          return prevUser;
                        }

                        return {
                          ...prevUser,
                          expirationDate: newValue ? newValue : undefined,
                        };
                      });
                    }}
                    InputLabelProps={{ shrink: true, style: { color: '#64748B' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: '#1E293B' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                      }
                    }}
                    disabled={isLifetimeAccess}
                    helperText={
                      isLifetimeAccess
                        ? lifetimePlan
                          ? '♾️ Plano vitalício - acesso ilimitado'
                          : '♾️ Acesso marcado como vitalício'
                        : user.expirationDate
                          ? expired
                            ? '🔴 Acesso expirado'
                            : '⏰ Acesso válido até ' + new Date(user.expirationDate).toLocaleDateString('pt-BR')
                          : 'Sem data de vencimento - defina uma data ou marque como vitalício'
                    }
                    FormHelperTextProps={{
                      sx: {
                        color: expired
                          ? '#EF4444'
                          : isLifetimeAccess
                            ? '#0EA5E9'
                            : '#64748B'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissões de Acesso */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1E293B', fontWeight: '600' }}>
                🔓 Permissões de Acesso
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                <strong>Plano atual:</strong> {getPlanInfo(user.plan).label} | 
                <strong> Permissões customizadas:</strong> Liberações extras independente do plano
              </Typography>

              {contentCategories.map(category => (
                <Box key={category} mb={2}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: category === 'Administrativo' ? '#1D4ED8' : '#F59E0B',
                      mb: 1,
                      fontWeight: '600'
                    }}
                  >
                    {category}:
                  </Typography>
                  <FormGroup>
                    {availableContents
                      .filter(content => content.category === category)
                      .map(content => {
                        const fromPlan = isPermissionFromPlan(content.id);
                        const fromEntitlement = isPermissionFromEntitlement(content.id);
                        const fromCustom = isCustomPermission(content.id);
                        const hasAccess = hasPermission(content.id);
                        
                        return (
                          <Box key={content.id} display="flex" alignItems="center" gap={1}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={hasAccess}
                                  onChange={(e) => {
                                    if (!fromPlan && !fromEntitlement) {
                                      handlePermissionChange(content.id, e.target.checked);
                                    }
                                  }}
                                  disabled={fromPlan || fromEntitlement}
                                  sx={{ 
                                    color: fromPlan ? '#94A3B8' : '#3B82F6', 
                                    '&.Mui-checked': { 
                                      color: fromPlan ? '#94A3B8' : '#3B82F6' 
                                    },
                                    '&.Mui-disabled': {
                                      color: '#CBD5E1'
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography sx={{ 
                                    color: fromPlan ? '#94A3B8' : '#1E293B',
                                    fontSize: '0.875rem'
                                  }}>
                                    {content.label}
                                  </Typography>
                                  {fromPlan && (
                                    <Chip
                                      label="Plano"
                                      size="small"
                                      sx={{
                                        backgroundColor: '#EFF6FF',
                                        color: '#3B82F6',
                                        fontSize: '10px',
                                        height: '20px',
                                        border: '1px solid #DBEAFE'
                                      }}
                                    />
                                  )}
                                  {!fromPlan && fromEntitlement && (
                                    <Chip
                                      label="Add-on"
                                      size="small"
                                      sx={{
                                        backgroundColor: '#FEF2F2',
                                        color: '#DC2626',
                                        fontSize: '10px',
                                        height: '20px',
                                        border: '1px solid #FECACA'
                                      }}
                                    />
                                  )}
                                  {fromCustom && !fromPlan && !fromEntitlement && (
                                    <Chip
                                      label="Extra"
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: '#F0FDF4',
                                        color: '#10B981',
                                        fontSize: '10px',
                                        height: '20px',
                                        border: '1px solid #BBF7D0'
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ margin: 0 }}
                            />
                          </Box>
                        );
                      })}
                  </FormGroup>
                  <Divider sx={{ bgcolor: '#E2E8F0', my: 1 }} />
                </Box>
              ))}
              
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2, 
                  backgroundColor: '#EFF6FF', 
                  border: '1px solid #DBEAFE',
                  color: '#1E40AF'
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  ℹ️ <strong>Permissões do plano</strong> são automáticas e não podem ser removidas. 
                  <strong> Permissões extras</strong> podem ser adicionadas/removidas conforme necessário.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Migração para VIP */}
        <Grid item xs={12}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1E293B', fontWeight: '600' }}>
                📈 Migração para VIP
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                Simule o upgrade com base no valor total pago e gere o link de pagamento para o cliente.
              </Typography>

              {migrationError && (
                <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  {migrationError}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleMigrationSimulation}
                disabled={migrationLoading || isVipPlan}
                sx={{ 
                  bgcolor: '#3B82F6', 
                  color: '#FFFFFF', 
                  fontWeight: '600',
                  '&:hover': { bgcolor: '#2563EB' },
                  '&:disabled': { bgcolor: '#94A3B8' },
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  textTransform: 'none'
                }}
              >
                {migrationLoading ? 'Calculando...' : 'Simular migração para VIP'}
              </Button>
              {isVipPlan && (
                <Typography variant="body2" sx={{ color: '#94A3B8', mt: 1 }}>
                  Usuário já está no VIP ou possui acesso administrativo.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico de Compras */}
        <Grid item xs={12}>
          <Card sx={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 3, 
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1E293B', fontWeight: '600' }}>
                💰 Histórico de Compras
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Data</TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Produto</TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Valor</TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.length > 0 ? (
                      purchases.map((purchase) => (
                        <TableRow key={purchase.id} hover sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                          <TableCell sx={{ color: '#1E293B', borderBottom: '1px solid #F1F5F9' }}>
                            {new Date(purchase.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell sx={{ color: '#1E293B', borderBottom: '1px solid #F1F5F9' }}>{purchase.product}</TableCell>
                          <TableCell sx={{ color: '#1E293B', borderBottom: '1px solid #F1F5F9' }}>{formatCurrency(purchase.amount)}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #F1F5F9' }}>
                            <Chip
                              label={purchase.status}
                              size="small"
                              color={purchase.status === 'COMPLETED' ? 'success' : 'warning'}
                              sx={{ fontWeight: '500', fontSize: '0.75rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: '#64748B', textAlign: 'center', borderBottom: '1px solid #F1F5F9' }}>
                          Nenhuma compra registrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Migração */}
      <Dialog 
        open={migrationDialogOpen} 
        onClose={() => setMigrationDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid #E2E8F0'
          }
        }}
      >
        <DialogTitle sx={{ color: '#1E293B', fontWeight: '600' }}>
          Simulação de Migração para VIP
        </DialogTitle>
        <DialogContent>
          {migrationSimulation && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography sx={{ color: '#475569' }}>
                <strong>Plano atual:</strong> {migrationSimulation.fromPlan}
              </Typography>
              <Typography sx={{ color: '#475569' }}>
                <strong>Última compra:</strong>{' '}
                {new Date(migrationSimulation.purchaseDate).toLocaleDateString('pt-BR')}
              </Typography>
              {migrationSimulation.productName && (
                <Typography sx={{ color: '#475569' }}>
                  <strong>Produto comprado:</strong> {migrationSimulation.productName}
                </Typography>
              )}
              {migrationSimulation.expirationDate && (
                <Typography sx={{ color: '#475569' }}>
                  <strong>Vencimento atual:</strong>{' '}
                  {new Date(migrationSimulation.expirationDate).toLocaleDateString('pt-BR')}
                </Typography>
              )}
              <Typography sx={{ color: '#475569' }}>
                <strong>Meses utilizados:</strong> {migrationSimulation.monthsUsed}
              </Typography>
              <Typography sx={{ color: '#475569' }}>
                <strong>Meses restantes:</strong> {migrationSimulation.monthsRemaining}
              </Typography>
              <Typography sx={{ color: '#475569' }}>
                <strong>Total pago:</strong> {formatCurrency(migrationSimulation.totalPaid)}
              </Typography>
              {migrationSimulation.installmentsTotal && (
                <Typography sx={{ color: '#475569' }}>
                  <strong>Parcelas contratadas:</strong> {migrationSimulation.installmentsTotal}x
                </Typography>
              )}
              {migrationSimulation.installmentsPaid !== null && (
                <Typography sx={{ color: '#475569' }}>
                  <strong>Parcelas pagas:</strong> {migrationSimulation.installmentsPaid}x
                </Typography>
              )}
              <Typography sx={{ color: '#475569' }}>
                <strong>Valor mensal:</strong> {formatCurrency(migrationSimulation.monthlyValue)}
                </Typography>
              <Divider />
              <Typography sx={{ color: '#1E293B' }}>
                <strong>Valor do VIP:</strong> {formatCurrency(migrationSimulation.vipPrice)}
              </Typography>
              <Typography sx={{ color: '#1E293B' }}>
                <strong>Crédito abatido:</strong> {formatCurrency(migrationSimulation.credit)}
              </Typography>
              <Typography sx={{ color: '#1E293B' }}>
                <strong>Detalhe do abatimento:</strong>{' '}
                {migrationSimulation.monthsRemaining}x {formatCurrency(migrationSimulation.monthlyValue)} ={' '}
                {formatCurrency(migrationSimulation.credit)}
              </Typography>
              <Typography sx={{ color: '#1E293B' }}>
                <strong>Total a pagar:</strong> {formatCurrency(migrationSimulation.finalPrice)}
              </Typography>
              {migrationSimulation.notices.map((notice) => (
                <Alert key={notice} severity="info" sx={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  {notice}
                </Alert>
              ))}
              {migrationLink && (
                <TextField
                  fullWidth
                  label="Link de pagamento"
                  value={migrationLink}
                  InputProps={{ readOnly: true }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setMigrationDialogOpen(false)}
            sx={{ 
              color: '#64748B',
              '&:hover': { backgroundColor: '#F8FAFC' }
            }}
          >
            Fechar
          </Button>
          {migrationLink && (
            <Button
              onClick={handleCopyMigrationLink}
              sx={{
                color: '#3B82F6',
                '&:hover': { backgroundColor: '#EFF6FF' }
              }}
            >
              Copiar link
            </Button>
          )}
          <Button 
            onClick={handleGenerateMigrationLink}
            disabled={migrationLinkLoading}
            sx={{
              color: '#10B981',
              '&:hover': { backgroundColor: '#ECFDF5' },
              fontWeight: 600
            }}
          >
            {migrationLinkLoading ? 'Gerando link...' : 'Gerar link de pagamento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid #E2E8F0'
          }
        }}
      >
        <DialogTitle sx={{ color: '#1E293B', fontWeight: '600' }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748B' }}>
            Tem certeza que deseja excluir o usuário "{user.firstName} {user.lastName}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            sx={{ 
              color: '#64748B',
              '&:hover': { backgroundColor: '#F8FAFC' }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            sx={{
              color: '#EF4444',
              '&:hover': { backgroundColor: '#FEF2F2' }
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
