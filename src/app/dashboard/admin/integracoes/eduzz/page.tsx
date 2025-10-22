'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Grid,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { EDUZZ_INTEGRATIONS, type TokenIntegrationConfig } from '@/data/integrations';

type EduzzIntegration = TokenIntegrationConfig & { webhookUrl: string };

export default function EduzzPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<EduzzIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<EduzzIntegration | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    productName: '',
    plan: 'VIP'
  });

  // Carregar integrações
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const realIntegrations: EduzzIntegration[] = EDUZZ_INTEGRATIONS.map(integration => ({
        ...integration,
        webhookUrl: origin ? `${origin}/api/webhooks/eduzz/${integration.token}` : integration.token,
      }));

      setIntegrations(realIntegrations);
      if (realIntegrations.length > 0) {
        console.log('✅ Integração Eduzz real carregada:', realIntegrations[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar integrações Eduzz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = () => {
    setEditingIntegration(null);
    setFormData({ productName: '', plan: 'VIP' });
    setOpenDialog(true);
  };

  const handleEditIntegration = (integration: EduzzIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      productName: integration.productName,
      plan: integration.plan
    });
    setOpenDialog(true);
  };

  const handleSaveIntegration = async () => {
    try {
      // Gerar token único para Eduzz
      const token = generateEduzzToken();
      
      if (editingIntegration) {
        // Atualizar integração existente
        setIntegrations(prev => 
          prev.map(int => 
            int.id === editingIntegration.id 
              ? { ...int, ...formData }
              : int
          )
        );
      } else {
        // Criar nova integração
        const integrationId = `ED${Math.random().toString().slice(2, 5)}`;
        const newIntegration: EduzzIntegration = {
          id: integrationId,
          ...formData,
          token: token,
          webhookUrl: `${window.location.origin}/api/webhooks/eduzz/${token}`,
          status: 'ACTIVE',
          createdAt: new Date().toISOString().split('T')[0],
          totalSales: 0
        };
        
        setIntegrations(prev => [...prev, newIntegration]);
        
        console.log('✅ Nova integração Eduzz criada:', newIntegration);
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar integração Eduzz:', error);
    }
  };

  // Função para gerar token único do Eduzz
  const generateEduzzToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let token = 'ED';
    for (let i = 0; i < 15; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleDeleteIntegration = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      setIntegrations(prev => prev.filter(int => int.id !== id));
    }
  };

  const toggleIntegrationStatus = async (id: string) => {
    setIntegrations(prev =>
      prev.map(int =>
        int.id === id
          ? { ...int, status: int.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : int
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  // ✅ FUNÇÃO ATUALIZADA COM LITE_V2
  const getPlanInfo = (plan: string) => {
    const planMap: Record<string, { label: string; color: string; emoji: string }> = {
      'VIP': { label: 'Close Friends VIP', color: '#7C3AED', emoji: '👑' },
      'LITE': { label: 'Close Friends LITE', color: '#2563EB', emoji: '⭐' },
      'LITE_V2': { label: 'Close Friends LITE 2.0', color: '#1d4ed8', emoji: '🌟' }, // ✅ ADICIONADO
      'RENDA_PASSIVA': { label: 'Projeto Renda Passiva', color: '#059669', emoji: '💰' },
      'FIIS': { label: 'Projeto FIIs', color: '#D97706', emoji: '🏢' },
      'RENDA_TURBINADA': { label: 'CF Renda Turbinada', color: '#F97316', emoji: '⚡' },
      'AMERICA': { label: 'Projeto América', color: '#DC2626', emoji: '🇺🇸' }
    };
    return planMap[plan] || { label: plan, color: '#6B7280', emoji: '📋' };
  };

  const totalSales = integrations.reduce((sum, int) => sum + (int.totalSales || 0), 0);
  const activeIntegrations = integrations.filter(int => int.status === 'ACTIVE').length;

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="/dashboard/admin/integracoes"
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          onClick={(e) => { e.preventDefault(); router.push('/dashboard/admin/integracoes'); }}
        >
          🔗 Integrações
        </Link>
        <Typography color="text.primary">📚 Eduzz</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box mb={5}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: '#FF6B3520', color: '#FF6B35', mr: 3, width: 56, height: 56, fontSize: '24px' }}>
            📚
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: '#1E293B', fontWeight: '700' }}>
              Integrações Eduzz
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Gerencie webhooks para produtos da plataforma Eduzz
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ✅ ALERTA DE STATUS DA EDUZZ */}
      <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
          📚 Eduzz Configurada!
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          Token <strong>EDm2rYeqZWZHmCVmA</strong> detectado no teste. Webhook URL: <code>/api/webhooks/eduzz/EDm2rYeqZWZHmCVmA</code>
        </Typography>
      </Alert>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', mr: 2, fontSize: '20px' }}>
                  🔗
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Integrações
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {integrations.length}
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
                    Ativas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {activeIntegrations}
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
                    Total Vendas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {totalSales}
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
                <Avatar sx={{ bgcolor: '#FF6B3520', color: '#FF6B35', mr: 2, fontSize: '20px' }}>
                  📚
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Plataforma
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700', fontSize: '1.5rem' }}>
                    Eduzz
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Informações específicas do Eduzz */}
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
          📚 Configuração no Eduzz:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          No painel do Eduzz, vá em <strong>Integrações → Webhooks</strong>, adicione a URL gerada e selecione os eventos: <strong>order.paid</strong>, <strong>order.refunded</strong> e <strong>order.cancelled</strong>.
        </Typography>
      </Alert>

      {/* Actions */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: '600' }}>
          Suas Integrações Eduzz ({integrations.length})
        </Typography>
        <Button
          variant="contained"
          onClick={handleCreateIntegration}
          sx={{ 
            bgcolor: '#FF6B35', 
            '&:hover': { bgcolor: '#E85A2B' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: '600'
          }}
        >
          📚 Nova Integração Eduzz
        </Button>
      </Box>

      {/* Integrações Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Produto</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Plano</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Token</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Webhook URL</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Vendas</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#475569' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {integrations.map((integration) => {
                const planInfo = getPlanInfo(integration.plan);
                
                return (
                  <TableRow key={integration.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ 
                          bgcolor: '#FF6B3520', 
                          color: '#FF6B35', 
                          mr: 2, 
                          width: 32, 
                          height: 32 
                        }}>
                          📚
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: '500' }}>
                            Webhook Eduzz #{integration.id}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {integration.productName}
                          </Typography>
                        </Box>
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
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" sx={{ 
                          fontFamily: 'monospace', 
                          color: '#64748B',
                          backgroundColor: '#F8FAFC',
                          padding: '4px 8px',
                          borderRadius: 1,
                          border: '1px solid #E2E8F0',
                          fontSize: '0.75rem'
                        }}>
                          {integration.token?.substring(0, 12)}...
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(integration.token || '')}
                          sx={{ color: '#FF6B35' }}
                          title="Copiar Token"
                        >
                          📋
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={integration.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={integration.status === 'ACTIVE' ? 'success' : 'default'}
                        sx={{ fontWeight: '500' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" sx={{ 
                          fontFamily: 'monospace', 
                          color: '#64748B',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {integration.webhookUrl}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(integration.webhookUrl)}
                          sx={{ color: '#FF6B35' }}
                          title="Copiar URL Completa"
                        >
                          🔗
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: '500' }}>
                        {integration.totalSales || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => toggleIntegrationStatus(integration.id)}
                          sx={{ 
                            color: integration.status === 'ACTIVE' ? '#DC2626' : '#059669',
                            backgroundColor: integration.status === 'ACTIVE' ? '#FEF2F2' : '#F0FDF4'
                          }}
                          title={integration.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                        >
                          {integration.status === 'ACTIVE' ? '⏸️' : '▶️'}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditIntegration(integration)}
                          sx={{ color: '#FF6B35', backgroundColor: '#FF6B3510' }}
                          title="Editar"
                        >
                          ⚙️
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteIntegration(integration.id)}
                          sx={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
                          title="Excluir"
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

        {integrations.length === 0 && !loading && (
          <Box p={6} textAlign="center">
            <Typography variant="h6" sx={{ color: '#64748B', mb: 2 }}>
              📚 Nenhuma integração Eduzz configurada
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Crie sua primeira integração com a Eduzz para começar a receber vendas automaticamente.
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateIntegration}
              sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E85A2B' } }}
            >
              Criar Primeira Integração Eduzz
            </Button>
          </Box>
        )}
      </Card>

      {/* Dialog para criar/editar integração */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIntegration ? 'Editar Integração Eduzz' : 'Nova Integração Eduzz'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Nome do Produto/Configuração"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              fullWidth
              placeholder="Ex: Projeto Trump Eduzz, Close Friends VIP Eduzz"
              helperText="Nome para identificar esta integração internamente"
            />
            
            <FormControl fullWidth>
              <InputLabel>Plano do Sistema</InputLabel>
              <Select
                value={formData.plan}
                onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                label="Plano do Sistema"
              >
                <MenuItem value="VIP">👑 Close Friends VIP</MenuItem>
                <MenuItem value="LITE">⭐ Close Friends LITE</MenuItem>
                <MenuItem value="LITE_V2">🌟 Close Friends LITE 2.0</MenuItem>
                <MenuItem value="RENDA_PASSIVA">💰 Projeto Renda Passiva</MenuItem>
                <MenuItem value="FIIS">🏢 Projeto FIIs</MenuItem>
                <MenuItem value="RENDA_TURBINADA">⚡ CF Renda Turbinada</MenuItem>
                <MenuItem value="AMERICA">🇺🇸 Projeto América</MenuItem>
              </Select>
            </FormControl>
            
            {!editingIntegration && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                  ✅ Configuração no Eduzz:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  1. Acesse <strong>Integrações → Webhooks</strong> no painel Eduzz<br/>
                  2. Cole a URL gerada automaticamente<br/>
                  3. Selecione eventos: <strong>order.paid</strong>, <strong>order.refunded</strong>, <strong>order.cancelled</strong><br/>
                  4. Salve a configuração
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveIntegration}
            disabled={!formData.productName}
            sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E85A2B' } }}
          >
            {editingIntegration ? 'Salvar Alterações' : 'Criar Integração'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}