'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  TextField,
  Chip
} from '@mui/material';

interface ImportUser {
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  status?: string;
  expirationDate?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  updated: number;
  total: number;
  errors: string[];
}

export default function ImportUsuariosPage() {
  const [csvData, setCsvData] = useState<ImportUser[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ImportUser[]>([]);

  // Parse CSV simples
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const users: ImportUser[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length >= 3) {
        const user: ImportUser = {
          firstName: values[0] || 'Nome',
          lastName: values[1] || 'Sobrenome',
          email: values[2] || '',
          plan: values[3] || 'VIP',
          status: values[4] || 'ACTIVE',
          expirationDate: values[5] || '' // Nova coluna de data de vencimento
        };
        
        if (user.email && user.email.includes('@')) {
          users.push(user);
        }
      }
    }
    
    setCsvData(users);
    setPreviewData(users.slice(0, 10));
    setResult(null);
  };

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  // Importação em lotes
  const handleImport = async () => {
    if (csvData.length === 0) return;
    
    setImporting(true);
    setProgress(0);
    setResult(null);
    
    const batchSize = 100;
    const totalBatches = Math.ceil(csvData.length / batchSize);
    
    let successCount = 0;
    let failedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    
    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, csvData.length);
        const batch = csvData.slice(start, end);
        
        console.log(`📦 Processando lote ${i + 1}/${totalBatches}`);
        
        try {
          const response = await fetch('/api/admin/bulk-import', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ users: batch })
          });
          
          if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
          }
          
          const batchResult = await response.json();
          
          successCount += batchResult.success || 0;
          failedCount += batchResult.failed || 0;
          updatedCount += batchResult.updated || 0;
          
          if (batchResult.errors) {
            errors.push(...batchResult.errors);
          }
          
        } catch (error: any) {
          console.error(`❌ Erro no lote ${i + 1}:`, error);
          errors.push(`Lote ${i + 1}: ${error.message}`);
          failedCount += batch.length;
        }
        
        const progressPercent = ((i + 1) / totalBatches) * 100;
        setProgress(progressPercent);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setResult({
        success: successCount,
        failed: failedCount,
        updated: updatedCount,
        total: csvData.length,
        errors
      });
      
    } catch (error: any) {
      console.error('❌ Erro geral na importação:', error);
      errors.push(`Erro geral: ${error.message}`);
    }
    
    setImporting(false);
    setProgress(100);
  };

  const clearData = () => {
    setCsvData([]);
    setPreviewData([]);
    setResult(null);
    setProgress(0);
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      'VIP': '#7C3AED',
      'LITE': '#2563EB', 
      'RENDA_PASSIVA': '#059669',
      'FIIS': '#D97706',
      'RENDA_TURBINADA': '#F97316',
      'AMERICA': '#DC2626'
    };
    return colors[plan] || '#6B7280';
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1E293B', fontWeight: '700' }}>
          📤 Importação em Massa de Usuários
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Importe seus clientes existentes de uma só vez
        </Typography>
      </Box>

      {/* Instruções */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📋 Formato do Arquivo CSV</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Seu arquivo deve ter as colunas na seguinte ordem:
          </Typography>
          <Box sx={{ fontFamily: 'monospace', backgroundColor: '#F1F5F9', p: 2, borderRadius: 1 }}>
            <strong>nome,sobrenome,email,plano,status,vencimento</strong>
          </Box>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#64748B' }}>
            Exemplo: João,Silva,joao@email.com,VIP,ACTIVE,2025-12-31
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#EF4444' }}>
            ⚠️ Data de vencimento no formato: AAAA-MM-DD (ex: 2025-12-31)
          </Typography>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📤 Selecionar Arquivo</Typography>
          <Box
            sx={{
              border: '2px dashed #CBD5E1',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: '#FFFFFF'
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                size="large"
                sx={{ 
                  bgcolor: '#10B981', 
                  '&:hover': { bgcolor: '#059669' },
                  mb: 2
                }}
              >
                📁 Selecionar Arquivo CSV
              </Button>
            </label>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Formato aceito: .csv
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Preview dos Dados */}
      {previewData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                👀 Preview - {csvData.length} usuários carregados
              </Typography>
              <Button variant="outlined" onClick={clearData} disabled={importing}>
                🗑️ Limpar
              </Button>
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Plano</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Vencimento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.plan}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getPlanColor(user.plan)}20`,
                            color: getPlanColor(user.plan)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          color={user.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.expirationDate || 'Não definida'}
                          size="small"
                          color={user.expirationDate ? 'primary' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {csvData.length > 10 && (
              <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Mostrando 10 de {csvData.length} usuários. Todos serão importados.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botão de Importação */}
      {csvData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                🚀 Pronto para importar {csvData.length} usuários
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleImport}
                disabled={importing}
                sx={{ 
                  bgcolor: '#10B981', 
                  '&:hover': { bgcolor: '#059669' },
                  minWidth: 200
                }}
              >
                {importing ? '⏳ Importando...' : '🚀 Iniciar Importação'}
              </Button>
            </Box>
            
            {importing && (
              <Box mt={3}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Progresso: {Math.round(progress)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado da Importação */}
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#059669' }}>
              ✅ Importação Concluída!
            </Typography>
            
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} sx={{ backgroundColor: '#DCFCE7', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ color: '#166534', fontWeight: 'bold' }}>
                    {result.success}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#166534' }}>
                    ✅ Criados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} sx={{ backgroundColor: '#FEF3C7', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ color: '#92400E', fontWeight: 'bold' }}>
                    {result.updated}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#92400E' }}>
                    🔄 Atualizados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} sx={{ backgroundColor: '#FEE2E2', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ color: '#991B1B', fontWeight: 'bold' }}>
                    {result.failed}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#991B1B' }}>
                    ❌ Falharam
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} sx={{ backgroundColor: '#EFF6FF', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ color: '#1D4ED8', fontWeight: 'bold' }}>
                    {result.total}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1D4ED8' }}>
                    📊 Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {result.errors.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ⚠️ Erros encontrados:
                </Typography>
                {result.errors.slice(0, 5).map((error, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    • {error}
                  </Typography>
                ))}
                {result.errors.length > 5 && (
                  <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic' }}>
                    ... e mais {result.errors.length - 5} erros
                  </Typography>
                )}
              </Alert>
            )}
            
            <Button
              variant="outlined"
              onClick={clearData}
              sx={{ mt: 2 }}
            >
              🔄 Nova Importação
            </Button>
            
            <Button
              variant="contained"
              href="/dashboard/admin/usuarios"
              sx={{ mt: 2, ml: 2, bgcolor: '#059669' }}
            >
              👥 Ver Usuários Importados
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}