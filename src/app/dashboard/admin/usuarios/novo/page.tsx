'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  Alert,
  Chip,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider
} from '@mui/material';
import { useUser } from '@/hooks/use-user';
import { PLAN_PERMISSIONS } from '@/lib/permissions';

type PlanKey = keyof typeof PLAN_PERMISSIONS;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  plan: PlanKey;
  expirationDate: string;
}

export default function NovoUsuarioPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  
  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    plan: 'LITE',
    expirationDate: ''
  });
  const [customPermissions, setCustomPermissions] = React.useState<string[]>([]);

  const adminResources = React.useMemo(
    () => [
      { id: 'admin', label: 'Painel Administrativo' },
      { id: 'admin-dashboard', label: 'Dashboard Admin' },
      { id: 'admin-usuarios', label: 'Gestão de Usuários' },
      { id: 'admin-instagram', label: 'Instagram Close Friends' },
      { id: 'admin-integracoes', label: 'Integrações' },
      { id: 'admin-renovacoes', label: 'Renovações' },
      { id: 'admin-migracao-vip', label: 'Migração VIP' },
      { id: 'admin-empresas', label: 'Gestão de Empresas' },
      { id: 'admin-proventos', label: 'Central de Proventos' },
      { id: 'admin-relatorios', label: 'Gestão de Relatórios' },
      { id: 'admin-relatorio-semanal', label: 'Relatório Semanal' },
      { id: 'admin-analises-trimesestrais', label: 'Análises Trimestrais' },
      { id: 'admin-analise-tecnica', label: 'Análises Técnicas' },
      { id: 'admin-carteiras', label: 'Analisar Carteiras' },
      { id: 'admin-settings', label: 'Configurações' },
      { id: 'admin-central-duvidas', label: 'Central de Dúvidas' }
    ],
    []
  );

  const isAnalistaPlan = formData.plan === 'ANALISTA';

  const planPermissions = React.useMemo(() => {
    const planConfig = PLAN_PERMISSIONS[formData.plan];
    return planConfig?.pages ?? [];
  }, [formData.plan]);

  const handlePlanChange = (plan: PlanKey) => {
    setFormData(prev => ({ ...prev, plan }));

    if (plan !== 'ANALISTA') {
      setCustomPermissions([]);
    }
  };

  // Verificar se é admin
  React.useEffect(() => {
    if (user && 'plan' in user && user.plan !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        customPermissions: isAnalistaPlan ? customPermissions : []
      };

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/usuarios');
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAdminPermission = (permissionId: string, checked: boolean) => {
    setCustomPermissions(prev => {
      const normalizedId = permissionId.trim();

      if (!normalizedId) {
        return prev;
      }

      if (checked) {
        return Array.from(new Set([...prev, normalizedId]));
      }

      return prev.filter(permission => permission !== normalizedId);
    });
  };

  // ✅ FUNÇÃO PARA OBTER INFO DOS PLANOS
  const getPlanInfo = (planValue: string) => {
    const planMap: Record<string, { label: string; description: string; color: string; emoji: string; isNew?: boolean }> = {
      'VIP': { 
        label: 'Close Friends VIP', 
        description: 'Acesso completo a todas as funcionalidades',
        color: '#7C3AED', 
        emoji: '👑' 
      },
      'LITE': { 
        label: 'Close Friends LITE', 
        description: 'Acesso básico com recursos essenciais',
        color: '#2563EB', 
        emoji: '⭐' 
      },
      'LITE_V2': { 
        label: 'Close Friends LITE 2.0', 
        description: 'Nova versão do LITE com recursos atualizados',
        color: '#1d4ed8', 
        emoji: '🌟',
        isNew: true
      },
      'RENDA_PASSIVA': { 
        label: 'Projeto Renda Passiva', 
        description: 'Foco em dividendos e renda passiva',
        color: '#059669', 
        emoji: '💰' 
      },
      'FIIS': {
        label: 'Projeto FIIs',
        description: 'Especializado em Fundos Imobiliários',
        color: '#D97706',
        emoji: '🏢'
      },
      'RENDA_TURBINADA': {
        label: 'CF Renda Turbinada',
        description: 'Plano focado em estratégias com opções e renda mensal turbinada',
        color: '#F97316',
        emoji: '⚡',
        isNew: true
      },
      'RENDA_TURBINADA_T2': {
        label: 'CF Renda Turbinada - Turma 2',
        description: 'Segunda turma do Renda Turbinada com conteúdos atualizados',
        color: '#FB923C',
        emoji: '⚡',
        isNew: true
      },
      'RENDA_TURBINADA_T3': {
        label: 'CF Renda Turbinada - Turma 3',
        description: 'Terceira turma do Renda Turbinada com novos conteúdos',
        color: '#FDBA74',
        emoji: '⚡',
        isNew: true
      },
      'ANALISTA': {
        label: 'Perfil Analista',
        description: 'Acesso administrativo personalizado à central e ferramentas selecionadas',
        color: '#2563EB',
        emoji: '📊'
      },
      'AMERICA': {
        label: 'Projeto América',
        description: 'Investimentos internacionais',
        color: '#DC2626',
        emoji: '🇺🇸'
      },
      'ADMIN': { 
        label: 'Administrador', 
        description: 'Acesso administrativo completo',
        color: '#4B5563', 
        emoji: '🛡️' 
      }
    };
    return planMap[planValue] || { label: planValue, description: '', color: '#6B7280', emoji: '📋' };
  };

  const selectedPlanInfo = getPlanInfo(formData.plan);

  if (success) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Usuário criado com sucesso! Email enviado com as credenciais.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={4}>
        <Button 
          onClick={() => router.push('/dashboard/admin/usuarios')}
          sx={{ color: '#3B82F6', mb: 2 }}
        >
          ← Voltar para lista
        </Button>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1E293B', fontWeight: '700' }}>
          ➕ Novo Usuário
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Crie um novo usuário e envie as credenciais por email
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ✅ ALERTA INFORMATIVO SOBRE LITE_V2 */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
          🌟 Novidade: Close Friends LITE 2.0
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          O novo plano LITE 2.0 está disponível com recursos atualizados. Ideal para usuários que vêm da Kiwify.
        </Typography>
      </Alert>

      <Card sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: 700,
        width: '100%',
        mx: 'auto'
      }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sobrenome"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  sx={{
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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Plano</InputLabel>
                  <Select
                    value={formData.plan}
                    onChange={(e) => handlePlanChange(e.target.value as PlanKey)}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6', borderWidth: '2px' }
                    }}
                  >
                    <MenuItem value="VIP">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>👑</span>
                        <span>Close Friends VIP</span>
                      </Box>
                    </MenuItem>
                    
                    <MenuItem value="LITE">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>⭐</span>
                        <span>Close Friends LITE</span>
                      </Box>
                    </MenuItem>
                    
                    {/* ✅ LITE_V2 ADICIONADO COM BADGE */}
                    <MenuItem value="LITE_V2">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>🌟</span>
                        <span>Close Friends LITE 2.0</span>
                        <Chip 
                          label="NOVO" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#1d4ed8', 
                            color: 'white', 
                            fontWeight: '700',
                            fontSize: '10px',
                            height: '18px',
                            ml: 1
                          }} 
                        />
                      </Box>
                    </MenuItem>
                    
                    <MenuItem value="RENDA_PASSIVA">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>💰</span>
                        <span>Projeto Renda Passiva</span>
                      </Box>
                    </MenuItem>
                    
                    <MenuItem value="FIIS">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>🏢</span>
                        <span>Projeto FIIs</span>
                      </Box>
                    </MenuItem>
                    
                    <MenuItem value="AMERICA">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>🇺🇸</span>
                        <span>Projeto América</span>
                      </Box>
                    </MenuItem>

                    <MenuItem value="RENDA_TURBINADA">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>⚡</span>
                        <span>CF Renda Turbinada</span>
                        <Chip
                          label="NOVO"
                          size="small"
                          sx={{
                            bgcolor: '#F97316',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '10px',
                            height: '18px',
                            ml: 1
                          }}
                        />
                      </Box>
                    </MenuItem>

                    <MenuItem value="RENDA_TURBINADA_T2">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>⚡</span>
                        <span>CF Renda Turbinada - Turma 2</span>
                        <Chip
                          label="NOVO"
                          size="small"
                          sx={{
                            bgcolor: '#FB923C',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '10px',
                            height: '18px',
                            ml: 1
                          }}
                        />
                      </Box>
                    </MenuItem>

                    <MenuItem value="RENDA_TURBINADA_T3">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>⚡</span>
                        <span>CF Renda Turbinada - Turma 3</span>
                        <Chip
                          label="NOVO"
                          size="small"
                          sx={{
                            bgcolor: '#FDBA74',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '10px',
                            height: '18px',
                            ml: 1
                          }}
                        />
                      </Box>
                    </MenuItem>

                    <MenuItem value="ANALISTA">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>📊</span>
                        <span>Perfil Analista</span>
                      </Box>
                    </MenuItem>

                    <MenuItem value="ADMIN">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>🛡️</span>
                        <span>Administrador</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                {/* ✅ DESCRIÇÃO DO PLANO SELECIONADO */}
                <Box mt={2} p={2} sx={{
                  backgroundColor: `${selectedPlanInfo.color}10`,
                  borderRadius: 2,
                  border: `1px solid ${selectedPlanInfo.color}20`
                }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <span style={{ fontSize: '16px' }}>{selectedPlanInfo.emoji}</span>
                    <Typography variant="body2" sx={{ fontWeight: '600', color: selectedPlanInfo.color }}>
                      {selectedPlanInfo.label}
                    </Typography>
                    {selectedPlanInfo.isNew && (
                      <Chip
                        label="NOVO"
                        size="small"
                        sx={{
                          bgcolor: selectedPlanInfo.color,
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '10px',
                          height: '18px'
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {selectedPlanInfo.description}
                  </Typography>
                </Box>

                {isAnalistaPlan && (
                  <Box
                    mt={3}
                    p={3}
                    sx={{
                      backgroundColor: '#F1F5F9',
                      borderRadius: 2,
                      border: '1px solid #CBD5F5'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B', mb: 1 }}>
                      🛠️ Acessos administrativos do Analista
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                      Escolha quais áreas administrativas o analista poderá acessar. A Central de Dúvidas fica sempre disponível para que ele responda às perguntas dos membros.
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormGroup>
                      {adminResources.map(resource => {
                        const fromPlan = planPermissions.includes(resource.id);
                        const checked = fromPlan || customPermissions.includes(resource.id);

                        return (
                          <FormControlLabel
                            key={resource.id}
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={(event) => toggleAdminPermission(resource.id, event.target.checked)}
                                disabled={fromPlan}
                                sx={{
                                  color: '#2563EB',
                                  '&.Mui-checked': { color: '#2563EB' }
                                }}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography sx={{ color: fromPlan ? '#1E40AF' : '#0F172A', fontSize: '0.875rem' }}>
                                  {resource.label}
                                </Typography>
                                {fromPlan && (
                                  <Chip
                                    label="Plano"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#DBEAFE',
                                      color: '#1D4ED8',
                                      fontSize: '10px',
                                      height: '18px'
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            sx={{ margin: 0 }}
                          />
                        );
                      })}
                    </FormGroup>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Data de Vencimento (opcional)"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Se não informada, será definida automaticamente para 1 ano"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' },
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box
                  display="flex"
                  gap={2}
                  justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                >
                  <Button
                    onClick={() => router.push('/dashboard/admin/usuarios')}
                    sx={{ color: '#64748B', width: { xs: '100%', sm: 'auto' } }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      bgcolor: '#3B82F6',
                      '&:hover': { bgcolor: '#2563EB' },
                      px: 4,
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    {loading ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
