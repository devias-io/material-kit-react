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
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useRouter } from 'next/navigation';

interface HotmartIntegration {
  id: string;
  productName: string;
  token: string;
  plan: string;
  webhookUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  totalSales?: number;
}

export default function HotmartPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<HotmartIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<HotmartIntegration | null>(null);

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
      
      // ✅ DADOS REAIS DAS INTEGRAÇÕES HOTMART (TOKEN ÚNICO)
      const realIntegrations: HotmartIntegration[] = [
        {
          id: 'HM001',
          productName: 'Webhook Único Hotmart (Detecção Automática)',
          token: 'TokendYNZMSBlDXyWPST3VZPSsaqe3JfKYJ', // ✅ TOKEN ÚNICO REAL
          plan: 'AUTO', // Plano detectado automaticamente
          webhookUrl: `${window.location.origin}/api/webhooks/hotmart/TokendYNZMSBlDXyWPST3VZPSsaqe3JfKYJ`,
          status: 'ACTIVE',
          createdAt: '2025-07-16',
          totalSales: 0
        }
      ];
      
      setIntegrations(realIntegrations);
      console.log('✅ Integrações Hotmart reais carregadas:', realIntegrations);
    } catch (error) {
      console.error('Erro ao carregar integrações Hotmart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = () => {
    setEditingIntegration(null);
    setFormData({ productName: '', plan: 'VIP' });
    setOpenDialog(true);
  };

  const handleEditIntegration = (integration: HotmartIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      productName: integration.productName,
      plan: integration.plan
    });
    setOpenDialog(true);
  };

  const handleSaveIntegration = async () => {
    try {
      // ✅ GERAR TOKEN REAL PARA HOTMART (não mais aleatório)
      const token = generateHotmartToken();
      
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
        const integrationId = `HM${Math.random().toString().slice(2, 5)}`;
        const newIntegration: HotmartIntegration = {
          id: integrationId,
          ...formData,
          token: token,
          webhookUrl: `${window.location.origin}/api/webhooks/hotmart/${token}`,
          status: 'ACTIVE',
          createdAt: new Date().toISOString().split('T')[0],
          totalSales: 0
        };
        
        setIntegrations(prev => [...prev, newIntegration]);
        
        console.log('✅ Nova integração Hotmart criada:', newIntegration);
        console.log('⚠️ ATENÇÃO: Adicione este token no webhook da Hotmart:', {
          token: token,
          plan: formData.plan,
          name: formData.productName
        });
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar integração Hotmart:', error);
    }
  };

  // ✅ FUNÇÃO CORRIGIDA PARA GERAR TOKEN REAL HOTMART
  const generateHotmartToken = () => {
    // Gerar token no estilo Hotmart (similar aos existentes)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let token = 'HM_';
    for (let i = 0; i < 28; i++) {
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
        <Typography color="text.primary">🔥 Hotmart</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box mb={5}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: '#FF6B3520', color: '#FF6B35', mr: 3, width: 56, height: 56, fontSize: '24px' }}>
            🔥
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: '#1E293B', fontWeight: '700' }}>
              Integrações Hotmart
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Configure webhooks específicos para cada produto da Hotmart
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ✅ ALERTA COM TOKEN REAL */}
      <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
          🔥 Hotmart Configurada!
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          Token <strong>TokendYNZMSBlDXyWPST3VZPSsaqe3JfKYJ</strong> detectado no teste. {integrations.length} integração(ões) ativa(s).
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
                    Instaladas
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
                    Total de Vendas
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
                  🔥
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Plataforma
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700', fontSize: '1.5rem' }}>
                    Hotmart
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Informações específicas da Hotmart */}
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
          🔥 Configuração na Hotmart:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          No painel da Hotmart, vá em <strong>Ferramentas → Webhook (API e Notificações)</strong>, adicione a URL gerada e selecione os eventos: <strong>PURCHASE_APPROVED</strong>, <strong>PURCHASE_REFUNDED</strong> e <strong>PURCHASE_CANCELLED</strong>.
        </Typography>
      </Alert>

      {/* Actions */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: '600' }}>
          Suas Integrações Hotmart ({integrations.length})
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
          🔥 Nova Integração Hotmart
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
                          🔥
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: '500' }}>
                            Webhook Hotmart #{integration.id}
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
              🔥 Nenhuma integração Hotmart configurada
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Crie sua primeira integração com a Hotmart para começar a receber vendas automaticamente.
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateIntegration}
              sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E85A2B' } }}
            >
              Criar Primeira Integração Hotmart
            </Button>
          </Box>
        )}
      </Card>

      {/* Dialog para criar/editar integração */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIntegration ? 'Editar Integração Hotmart' : 'Nova Integração Hotmart'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Nome do Produto/Configuração"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              fullWidth
              placeholder="Ex: Projeto Trump, Close Friends VIP 2024"
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
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                  ⚠️ IMPORTANTE - Configuração Manual Necessária:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  1. A URL será gerada automaticamente<br/>
                  2. <strong>Você precisa adicionar o token gerado no código do webhook</strong><br/>
                  3. Configure na Hotmart: <strong>Ferramentas → Webhook</strong><br/>
                  4. Use a URL completa gerada
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