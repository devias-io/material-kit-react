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
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  planoAtual: string;
  dataContratacao: string;
  dataExpiracao: string;
  status: string;
  origin: string;
}

interface CompraOriginal {
  id: string;
  valor: number;
  valorFormatado: string;
  formaPagamento: string;
  numeroParcelas: number;
  parcelamentoFormatado: string;
  plataforma: string;
  dataCompra: string;
  produtoNome: string;
}

interface Calculo {
  valorLite: number;
  valorLiteFormatado: string;
  valorVip: number;
  valorVipFormatado: string;
  mesesUtilizados: number;
  mesesRestantes: number;
  diferencaMensal: number;
  diferencaMensalFormatada: string;
  valorDesconto: number;
  valorDescontoFormatado: string;
  valorFinalMigracao: number;
  valorFinalMigracaoFormatado: string;
}

interface DadosMigracao {
  cliente: Cliente;
  compraOriginal: CompraOriginal;
  calculo: Calculo;
  observacoes: string[];
}

export default function MigracaoPlanoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [processando, setProcessando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [dadosMigracao, setDadosMigracao] = React.useState<DadosMigracao | null>(null);

  // Verificar se usuário é admin
  React.useEffect(() => {
    if (user && !user.customPermissions?.includes('admin')) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const buscarCliente = async () => {
    if (!email.trim()) {
      setError('Por favor, digite um e-mail');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setDadosMigracao(null);

    try {
      const response = await fetch(
        `/api/admin/migracao-plano/calcular?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar cliente');
      }

      const data = await response.json();
      setDadosMigracao(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar cliente');
      console.error('Erro ao buscar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const processarMigracao = async () => {
    if (!dadosMigracao) return;

    setProcessando(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/migracao-plano/processar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: dadosMigracao.cliente.id,
          valorFinal: dadosMigracao.calculo.valorFinalMigracao,
          mesesRestantes: dadosMigracao.calculo.mesesRestantes,
          valorDesconto: dadosMigracao.calculo.valorDesconto,
          observacoes: dadosMigracao.observacoes.join('\n')
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar migração');
      }

      const data = await response.json();
      setSuccess(`Migração processada com sucesso! ${dadosMigracao.cliente.nome} agora está no plano VIP.`);
      setDadosMigracao(null);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar migração');
      console.error('Erro ao processar migração:', err);
    } finally {
      setProcessando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      buscarCliente();
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={5}>
        <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: '700', mb: 1 }}>
          Migração de Plano (LITE → VIP)
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Calcule e processe migrações de clientes do plano LITE para o plano VIP
        </Typography>
      </Box>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Seção de Busca */}
      <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Buscar Cliente
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="E-mail do Cliente"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                placeholder="cliente@email.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '2px' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={buscarCliente}
                disabled={loading || !email.trim()}
                sx={{
                  py: 1.8,
                  backgroundColor: '#3B82F6',
                  '&:hover': { backgroundColor: '#2563EB' }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Buscar Cliente'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dados do Cliente e Cálculo */}
      {dadosMigracao && (
        <>
          {/* Informações do Cliente */}
          <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Informações do Cliente
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Nome</Typography>
                  <Typography variant="body1" fontWeight={500}>{dadosMigracao.cliente.nome}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">E-mail</Typography>
                  <Typography variant="body1" fontWeight={500}>{dadosMigracao.cliente.email}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Plano Atual</Typography>
                  <Chip
                    label={dadosMigracao.cliente.planoAtual}
                    sx={{ mt: 0.5, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={dadosMigracao.cliente.status}
                    sx={{ mt: 0.5, backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 600 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Origem</Typography>
                  <Chip
                    label={dadosMigracao.cliente.origin}
                    sx={{ mt: 0.5, backgroundColor: '#DBEAFE', color: '#1E40AF', fontWeight: 600 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Data de Contratação</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(dadosMigracao.cliente.dataContratacao).toLocaleDateString('pt-BR')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Data de Expiração</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(dadosMigracao.cliente.dataExpiracao).toLocaleDateString('pt-BR')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Dados da Compra Original */}
          <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Dados da Compra Original
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Valor Pago</Typography>
                  <Typography variant="h6" color="primary" fontWeight={600}>
                    {dadosMigracao.compraOriginal.valorFormatado}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Forma de Pagamento</Typography>
                  <Typography variant="body1" fontWeight={500}>{dadosMigracao.compraOriginal.formaPagamento}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Parcelamento</Typography>
                  <Typography variant="body1" fontWeight={500}>{dadosMigracao.compraOriginal.parcelamentoFormatado}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Plataforma</Typography>
                  <Typography variant="body1" fontWeight={500}>{dadosMigracao.compraOriginal.plataforma}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Data da Compra</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(dadosMigracao.compraOriginal.dataCompra).toLocaleDateString('pt-BR')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Cálculo da Migração */}
          <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', backgroundColor: '#F8FAFC' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Cálculo da Migração
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Plano Atual (LITE):</Typography>
                  <Typography fontWeight={600}>{dadosMigracao.calculo.valorLiteFormatado}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Plano Novo (VIP):</Typography>
                  <Typography fontWeight={600}>{dadosMigracao.calculo.valorVipFormatado}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography>Meses utilizados:</Typography>
                  <Typography fontWeight={600}>{dadosMigracao.calculo.mesesUtilizados} meses</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Meses restantes:</Typography>
                  <Typography fontWeight={600}>{dadosMigracao.calculo.mesesRestantes} meses</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography>Diferença mensal:</Typography>
                  <Typography fontWeight={600}>{dadosMigracao.calculo.diferencaMensalFormatada}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Desconto ({dadosMigracao.calculo.mesesRestantes} meses):</Typography>
                  <Typography fontWeight={600} color="success.main">
                    -{dadosMigracao.calculo.valorDescontoFormatado}
                  </Typography>
                </Box>
                <Divider sx={{ borderWidth: 2 }} />
                <Box display="flex" justifyContent="space-between" sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
                  <Typography variant="h6" fontWeight={700}>VALOR DA MIGRAÇÃO:</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {dadosMigracao.calculo.valorFinalMigracaoFormatado}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Observações Importantes
              </Typography>
              <Stack spacing={1}>
                {dadosMigracao.observacoes.map((obs, index) => (
                  <Alert key={index} severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                    {obs}
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Botão de Ação */}
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => setDadosMigracao(null)}
              disabled={processando}
              sx={{ px: 4, py: 1.5 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={processarMigracao}
              disabled={processando}
              sx={{
                px: 4,
                py: 1.5,
                backgroundColor: '#059669',
                '&:hover': { backgroundColor: '#047857' }
              }}
            >
              {processando ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Processar Migração'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
