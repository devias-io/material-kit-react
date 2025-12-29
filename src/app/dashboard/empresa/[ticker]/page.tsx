'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { aplicarViesOverride, normalizeViesOverride } from '@/utils/vies';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';
import { isTickerFII } from '@/utils/tickers';

// ========================================
// ÍCONES MOCK
// ========================================
const ArrowLeftIcon = () => <span>←</span>;
const TrendUpIcon = () => <span style={{ color: '#22c55e' }}>↗</span>;
const TrendDownIcon = () => <span style={{ color: '#ef4444' }}>↘</span>;
const RefreshIcon = () => <span>🔄</span>;
const WarningIcon = () => <span>⚠</span>;
const CheckIcon = () => <span>✓</span>;
const UploadIcon = () => <span>📤</span>;
const DownloadIconCustom = () => <span>📥</span>;
const DeleteIcon = () => <span>🗑</span>;
const FileIcon = () => <span>📄</span>;
const ViewIcon = () => <span>👁</span>;
const CloseIcon = () => <span>✕</span>;
const CloudUploadIconCustom = () => <span>☁️</span>;
const PictureAsPdfIconCustom = () => <span>📄</span>;

// ========================================
// CONSTANTES E CONFIGURAÇÕES
// ========================================
const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
// ========================================
// INTERFACES E TIPOS
// ========================================
interface DadosFinanceiros {
  precoAtual: number;
  variacao: number;
  variacaoPercent: number;
  volume: number;
  marketCap?: number;
  pl?: number;
  dy?: number;
}

interface EmpresaCompleta {
  ticker: string;
  nomeCompleto: string;
  setor: string;
  descricao: string;
  avatar: string;
  dataEntrada: string;
  precoIniciou: string;
  precoTeto: string;
  viesAtual: string;
  viesOverride?: 'AUTO' | 'MANTER';
  ibovespaEpoca: string;
  percentualCarteira: string;
  tipo?: 'FII';
  gestora?: string;
  dadosFinanceiros?: DadosFinanceiros;
  statusApi?: string;
  ultimaAtualizacao?: string;
}

export type TipoVisualizacao = 'iframe' | 'canva' | 'link' | 'pdf';

interface Relatorio {
  id: string;
  nome: string;
  tipo: 'trimestral' | 'anual' | 'apresentacao' | 'outros';
  dataUpload: string;
  dataReferencia: string;
  arquivo?: string;
  linkCanva?: string;
  linkExterno?: string;
  tamanho?: string;
  tipoVisualizacao: TipoVisualizacao;
  arquivoPdf?: string;
  nomeArquivoPdf?: string;
  tamanhoArquivo?: number;
  dataUploadPdf?: string;
  solicitarReupload?: boolean;  // ← ADICIONAR ESTA LINHA
  hashArquivo?: string;         // ← ADICIONAR ESTA LINHA
}
interface DadosFII {
  valorPatrimonial?: number;        // bookValue da API
  patrimonio?: number;              // calculado: bookValue * sharesOutstanding
  pvp?: number;                     // priceToBook da API
  valorMercado?: number;            // marketCap da API
  valorCaixa?: number;              // totalCash da API
  numeroCotas?: number;             // sharesOutstanding da API
  ultimoRendimento?: number;        // lastDividendValue da API
  dataUltimoRendimento?: string;    // lastDividendDate da API
  
  // Dados manuais (não disponíveis via API)
  dyCagr3Anos?: number;
  numeroCotistas?: number;
  
  // Metadados
  fonte: 'api' | 'manual' | 'misto';
  ultimaAtualizacao?: string;
}

// ========================================
// DADOS DE FALLBACK
// ========================================
const rawDadosFallback: Record<string, Omit<EmpresaCompleta, 'viesOverride'> & Record<string, unknown>> = {
  // ========================================
  // AGRICULTURA (2 ativos)
  // ========================================
  'KEPL3': {
    ticker: 'KEPL3',
    nomeCompleto: 'Kepler Weber S.A.',
    setor: 'Agricultura',
    descricao: 'A Kepler Weber é uma empresa brasileira especializada em soluções para armazenagem e movimentação de grãos, líquidos e gases.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/KEPL.png',
    dataEntrada: '21/03/2021',
    precoIniciou: 'R$ 7,30',
    precoTeto: 'R$ 12,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '115.000',
    percentualCarteira: '2.1%'
  },
  
  'AGRO3': {
    ticker: 'AGRO3',
    nomeCompleto: 'BrasilAgro S.A.',
    setor: 'Agricultura',
    descricao: 'A BrasilAgro é uma empresa do agronegócio com foco na produção de commodities agrícolas como soja, milho, algodão e açúcar.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/AGRO.png',
    dataEntrada: '15/08/2021',
    precoIniciou: 'R$ 24,80',
    precoTeto: 'R$ 35,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '125.000',
    percentualCarteira: '3.2%'
  },

  // ========================================
  // AUTOMOTIVO (1 ativo)
  // ========================================
  'LEVE3': {
    ticker: 'LEVE3',
    nomeCompleto: 'Metal Leve S.A.',
    setor: 'Automotivo',
    descricao: 'A Metal Leve é uma empresa brasileira líder na fabricação de autopeças, principalmente para motores e sistemas de transmissão.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/LEVE.png',
    dataEntrada: '10/09/2021',
    precoIniciou: 'R$ 18,75',
    precoTeto: 'R$ 28,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '118.500',
    percentualCarteira: '2.8%'
  },

  // ========================================
  // BANCOS (4 ativos)
  // ========================================
  'BBAS3': {
    ticker: 'BBAS3',
    nomeCompleto: 'Banco do Brasil S.A.',
    setor: 'Bancos',
    descricao: 'O Banco do Brasil é um dos maiores bancos do país, oferecendo serviços bancários completos para pessoas físicas, jurídicas e governo.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/BBAS.png',
    dataEntrada: '12/04/2020',
    precoIniciou: 'R$ 28,50',
    precoTeto: 'R$ 45,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '85.000',
    percentualCarteira: '5.5%'
  },

  'BRSR6': {
    ticker: 'BRSR6',
    nomeCompleto: 'Banrisul S.A.',
    setor: 'Bancos',
    descricao: 'O Banrisul é um banco brasileiro com forte presença no Rio Grande do Sul, oferecendo serviços bancários tradicionais e digitais.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/BRSR.png',
    dataEntrada: '08/06/2020',
    precoIniciou: 'R$ 4,85',
    precoTeto: 'R$ 8,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '95.000',
    percentualCarteira: '2.3%'
  },

  'ABCB4': {
    ticker: 'ABCB4',
    nomeCompleto: 'Banco ABC Brasil S.A.',
    setor: 'Bancos',
    descricao: 'O Banco ABC Brasil é uma instituição financeira focada em corporate banking e financiamento de projetos de infraestrutura.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ABCB.png',
    dataEntrada: '25/11/2020',
    precoIniciou: 'R$ 11,20',
    precoTeto: 'R$ 18,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '110.000',
    percentualCarteira: '1.8%'
  },

  'SANB11': {
    ticker: 'SANB11',
    nomeCompleto: 'Banco Santander Brasil S.A.',
    setor: 'Bancos',
    descricao: 'O Santander Brasil é um dos principais bancos do país, oferecendo serviços bancários completos com foco em inovação digital.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/SANB.png',
    dataEntrada: '14/07/2020',
    precoIniciou: 'R$ 25,80',
    precoTeto: 'R$ 42,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '102.000',
    percentualCarteira: '4.7%'
  },

  // ========================================
  // BENS INDUSTRIAIS (2 ativos)
  // ========================================
  'TASA4': {
    ticker: 'TASA4',
    nomeCompleto: 'Taurus Armas S.A.',
    setor: 'Bens Industriais',
    descricao: 'A Taurus é uma empresa brasileira fabricante de armas de fogo, munições e equipamentos de segurança.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/TASA.png',
    dataEntrada: '19/02/2021',
    precoIniciou: 'R$ 12,45',
    precoTeto: 'R$ 22,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '120.000',
    percentualCarteira: '2.4%'
  },

  'ROMI3': {
    ticker: 'ROMI3',
    nomeCompleto: 'Indústrias Romi S.A.',
    setor: 'Bens Industriais',
    descricao: 'A Romi é uma empresa brasileira fabricante de máquinas-ferramenta, equipamentos de fundição e sistemas de automação industrial.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ROMI.png',
    dataEntrada: '03/05/2021',
    precoIniciou: 'R$ 14,90',
    precoTeto: 'R$ 25,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '125.500',
    percentualCarteira: '2.6%'
  },

  // ========================================
  // CONSTRUÇÃO CIVIL (3 ativos)
  // ========================================
  'EZTC3': {
    ticker: 'EZTC3',
    nomeCompleto: 'EZ Tec Empreendimentos e Participações S.A.',
    setor: 'Construção Civil',
    descricao: 'A EZ Tec é uma incorporadora imobiliária brasileira focada no desenvolvimento de empreendimentos residenciais de alto padrão.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/EZTC.png',
    dataEntrada: '28/01/2022',
    precoIniciou: 'R$ 32,80',
    precoTeto: 'R$ 45,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '112.000',
    percentualCarteira: '3.8%'
  },

  'EVEN3': {
    ticker: 'EVEN3',
    nomeCompleto: 'Even Construtora e Incorporadora S.A.',
    setor: 'Construção Civil',
    descricao: 'A Even é uma das principais incorporadoras do Brasil, focada em empreendimentos residenciais de médio e alto padrão.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/EVEN.png',
    dataEntrada: '16/06/2021',
    precoIniciou: 'R$ 8,95',
    precoTeto: 'R$ 15,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '130.000',
    percentualCarteira: '2.9%'
  },

  'TRIS3': {
    ticker: 'TRIS3',
    nomeCompleto: 'Trisul S.A.',
    setor: 'Construção Civil',
    descricao: 'A Trisul é uma incorporadora imobiliária brasileira com foco em empreendimentos residenciais e comerciais em São Paulo.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/TRIS.png',
    dataEntrada: '22/09/2021',
    precoIniciou: 'R$ 5,12',
    precoTeto: 'R$ 9,80',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '115.500',
    percentualCarteira: '1.7%'
  },

  // ========================================
  // COMMODITIES (1 ativo)
  // ========================================
  'FESA4': {
    ticker: 'FESA4',
    nomeCompleto: 'Ferbasa S.A.',
    setor: 'Commodities',
    descricao: 'A Ferbasa é uma empresa brasileira líder na produção de ferroligas, especialmente ferro-silício e ferro-silício-manganês.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/FESA.png',
    dataEntrada: '11/12/2020',
    precoIniciou: 'R$ 4,49',
    precoTeto: 'R$ 14,07',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '119.000',
    percentualCarteira: '2.1%'
  },

  // ========================================
  // CONSUMO CÍCLICO (1 ativo)
  // ========================================
  'CEAB3': {
    ticker: 'CEAB3',
    nomeCompleto: 'C&A Modas S.A.',
    setor: 'Consumo Cíclico',
    descricao: 'A C&A é uma das maiores redes de varejo de moda do Brasil, oferecendo roupas e acessórios para toda a família.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/CEAB.png',
    dataEntrada: '07/04/2021',
    precoIniciou: 'R$ 18,20',
    precoTeto: 'R$ 28,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '122.000',
    percentualCarteira: '2.7%'
  },

  // ========================================
  // EDUCAÇÃO (2 ativos)
  // ========================================
  'CSED3': {
    ticker: 'CSED3',
    nomeCompleto: 'Cruzeiro do Sul Educacional S.A.',
    setor: 'Educação',
    descricao: 'A Cruzeiro do Sul Educacional é uma das maiores organizações educacionais do Brasil, oferecendo ensino superior e técnico.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/CSED.png',
    dataEntrada: '10/12/2023',
    precoIniciou: 'R$ 4,49',
    precoTeto: 'R$ 8,35',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '135.000',
    percentualCarteira: '1.9%'
  },

  'YDUQ3': {
    ticker: 'YDUQ3',
    nomeCompleto: 'Yduqs Participações S.A.',
    setor: 'Educação',
    descricao: 'A Yduqs é uma das maiores organizações educacionais privadas do Brasil, com foco em ensino superior presencial e a distância.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/YDUQ.png',
    dataEntrada: '30/05/2022',
    precoIniciou: 'R$ 15,80',
    precoTeto: 'R$ 25,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '118.000',
    percentualCarteira: '3.1%'
  },

  // ========================================
  // ENERGIA (6 ativos)
  // ========================================
  'ALUP11': {
    ticker: 'ALUP11',
    nomeCompleto: 'Alupar Investimento S.A.',
    setor: 'Energia',
    descricao: 'A Alupar é uma empresa brasileira de energia elétrica com foco em transmissão e geração de energia renovável.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ALUP.png',
    dataEntrada: '18/03/2022',
    precoIniciou: 'R$ 20,25',
    precoTeto: 'R$ 32,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '115.500',
    percentualCarteira: '3.6%'
  },

  'NEOE3': {
    ticker: 'NEOE3',
    nomeCompleto: 'Neoenergia S.A.',
    setor: 'Energia',
    descricao: 'A Neoenergia é uma das maiores empresas do setor elétrico brasileiro, atuando em distribuição, transmissão e geração de energia.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/NEOE.png',
    dataEntrada: '25/04/2022',
    precoIniciou: 'R$ 12,80',
    precoTeto: 'R$ 18,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '112.000',
    percentualCarteira: '2.9%'
  },

  'EGIE3': {
    ticker: 'EGIE3',
    nomeCompleto: 'Engie Brasil Energia S.A.',
    setor: 'Energia',
    descricao: 'A Engie Brasil é uma empresa de energia elétrica focada em geração renovável, especialmente hidrelétrica e eólica.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/EGIE.png',
    dataEntrada: '12/11/2021',
    precoIniciou: 'R$ 38,90',
    precoTeto: 'R$ 55,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '108.000',
    percentualCarteira: '4.2%'
  },

  'ELET3': {
    ticker: 'ELET3',
    nomeCompleto: 'Centrais Elétricas Brasileiras S.A. - Eletrobras',
    setor: 'Energia',
    descricao: 'A Eletrobras é a maior empresa de energia elétrica da América Latina, atuando em geração, transmissão e distribuição.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ELET.png',
    dataEntrada: '08/07/2022',
    precoIniciou: 'R$ 35,20',
    precoTeto: 'R$ 52,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '98.000',
    percentualCarteira: '4.8%'
  },

  'ISAE4': {
    ticker: 'ISAE4',
    nomeCompleto: 'ISA CTEEP S.A.',
    setor: 'Energia',
    descricao: 'A ISA CTEEP é uma empresa de transmissão de energia elétrica com uma das maiores redes de transmissão do Brasil.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ISAE.png',
    dataEntrada: '14/01/2023',
    precoIniciou: 'R$ 8,45',
    precoTeto: 'R$ 12,80',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '110.500',
    percentualCarteira: '2.2%'
  },

  'CPLE6': {
    ticker: 'CPLE6',
    nomeCompleto: 'Copel S.A.',
    setor: 'Energia',
    descricao: 'A Copel é uma empresa paranaense de energia elétrica que atua em geração, transmissão, distribuição e comercialização.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/CPLE.png',
    dataEntrada: '20/03/2023',
    precoIniciou: 'R$ 6,48',
    precoTeto: 'R$ 9,85',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '105.000',
    percentualCarteira: '1.8%'
  },

  // ========================================
  // FINANCEIRO (2 ativos)
  // ========================================
  'BBSE3': {
    ticker: 'BBSE3',
    nomeCompleto: 'BB Seguridade Participações S.A.',
    setor: 'Financeiro',
    descricao: 'A BB Seguridade é uma holding que atua nos segmentos de seguros, previdência complementar e capitalização.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/BBSE.png',
    dataEntrada: '05/02/2023',
    precoIniciou: 'R$ 28,50',
    precoTeto: 'R$ 42,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '113.000',
    percentualCarteira: '3.9%'
  },

  'B3SA3': {
    ticker: 'B3SA3',
    nomeCompleto: 'B3 S.A. - Brasil, Bolsa, Balcão',
    setor: 'Financeiro',
    descricao: 'A B3 é a principal bolsa de valores do Brasil, operando mercados de ações, derivativos, commodities e balcão organizado.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/B3SA.png',
    dataEntrada: '16/08/2022',
    precoIniciou: 'R$ 11,25',
    precoTeto: 'R$ 18,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '107.500',
    percentualCarteira: '3.4%'
  },

  // ========================================
  // INDUSTRIAL (3 ativos)
  // ========================================
  'TUPY3': {
    ticker: 'TUPY3',
    nomeCompleto: 'Tupy S.A.',
    setor: 'Industrial',
    descricao: 'A Tupy é uma empresa brasileira líder na produção de blocos e cabeçotes de motores automotivos em ferro fundido.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/TUPY.png',
    dataEntrada: '04/11/2020',
    precoIniciou: 'R$ 20,36',
    precoTeto: 'R$ 31,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '103.000',
    percentualCarteira: '3.7%'
  },

  'RAPT4': {
    ticker: 'RAPT4',
    nomeCompleto: 'Randon S.A. Implementos e Participações',
    setor: 'Industrial',
    descricao: 'A Randon é uma empresa brasileira fabricante de implementos rodoviários, autopeças e equipamentos para o agronegócio.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/RAPT.png',
    dataEntrada: '16/09/2021',
    precoIniciou: 'R$ 10,69',
    precoTeto: 'R$ 14,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '114.000',
    percentualCarteira: '2.3%'
  },

  'SHUL4': {
    ticker: 'SHUL4',
    nomeCompleto: 'Schulz S.A.',
    setor: 'Industrial',
    descricao: 'A Schulz é uma empresa brasileira fabricante de compressores de ar, equipamentos pneumáticos e soluções em ar comprimido.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/SHUL.png',
    dataEntrada: '29/07/2021',
    precoIniciou: 'R$ 8,90',
    precoTeto: 'R$ 14,20',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '128.000',
    percentualCarteira: '2.1%'
  },

  // ========================================
  // LOGÍSTICA (2 ativos)
  // ========================================
  'SIMH3': {
    ticker: 'SIMH3',
    nomeCompleto: 'SIMPAR S.A.',
    setor: 'Logística',
    descricao: 'A SIMPAR é uma holding que atua nos segmentos de logística, locação de veículos e soluções de mobilidade.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/SIMH.png',
    dataEntrada: '02/08/2022',
    precoIniciou: 'R$ 7,85',
    precoTeto: 'R$ 12,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '116.000',
    percentualCarteira: '2.4%'
  },

  'LOGG3': {
    ticker: 'LOGG3',
    nomeCompleto: 'Log Commercial Properties e Participações S.A.',
    setor: 'Logística',
    descricao: 'A LOG é uma empresa brasileira especializada no desenvolvimento e locação de condomínios logísticos.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/LOGG.png',
    dataEntrada: '18/05/2021',
    precoIniciou: 'R$ 22,40',
    precoTeto: 'R$ 35,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '125.000',
    percentualCarteira: '3.5%'
  },

  // ========================================
  // MINERAÇÃO (1 ativo)
  // ========================================
  'VALE3': {
    ticker: 'VALE3',
    nomeCompleto: 'Vale S.A.',
    setor: 'Mineração',
    descricao: 'A Vale é uma das maiores empresas de mineração do mundo, líder na produção de minério de ferro e pelotas.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/VALE.png',
    dataEntrada: '15/04/2020',
    precoIniciou: 'R$ 45,80',
    precoTeto: 'R$ 75,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '87.000',
    percentualCarteira: '6.2%'
  },

  // ========================================
  // NANOCAPS (3 ativos)
  // ========================================
  'CGRA4': {
    ticker: 'CGRA4',
    nomeCompleto: 'Grazziotin S.A.',
    setor: 'Nanocap/Consumo Cíclico',
    descricao: 'A Grazziotin é uma rede de varejo de moda e casa, com foco em cidades do interior do Brasil.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/CGRA.png',
    dataEntrada: '12/10/2021',
    precoIniciou: 'R$ 3,85',
    precoTeto: 'R$ 7,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '109.000',
    percentualCarteira: '1.2%'
  },

  'RSUL4': {
    ticker: 'RSUL4',
    nomeCompleto: 'Riograndense S.A.',
    setor: 'Nanocap/Industrial',
    descricao: 'A Riograndense é uma empresa brasileira produtora de óleos vegetais, farelos e biodiesel.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/RSUL.png',
    dataEntrada: '08/09/2021',
    precoIniciou: 'R$ 12,30',
    precoTeto: 'R$ 20,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '117.500',
    percentualCarteira: '1.9%'
  },

  'DEXP3': {
    ticker: 'DEXP3',
    nomeCompleto: 'Dexco S.A.',
    setor: 'Nanocap/Químico',
    descricao: 'A Dexco é uma empresa brasileira líder em soluções para banheiros, metais e acessórios.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/DEXP.png',
    dataEntrada: '14/06/2022',
    precoIniciou: 'R$ 8,75',
    precoTeto: 'R$ 15,20',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '105.500',
    percentualCarteira: '2.1%'
  },

  // ========================================
  // PAPEL E CELULOSE (2 ativos)
  // ========================================
  'RANI3': {
    ticker: 'RANI3',
    nomeCompleto: 'Irani Papel e Embalagem S.A.',
    setor: 'Papel',
    descricao: 'A Irani é uma empresa brasileira produtora de papéis para embalagem, papelão ondulado e pisos laminados.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/RANI.png',
    dataEntrada: '23/08/2021',
    precoIniciou: 'R$ 6,45',
    precoTeto: 'R$ 12,80',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '119.000',
    percentualCarteira: '2.0%'
  },

  'KLBN11': {
    ticker: 'KLBN11',
    nomeCompleto: 'Klabin S.A.',
    setor: 'Papel e Celulose',
    descricao: 'A Klabin é a maior produtora e exportadora de papéis do Brasil, líder nos mercados de papéis e cartões para embalagens.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/KLBN.png',
    dataEntrada: '27/01/2023',
    precoIniciou: 'R$ 18,90',
    precoTeto: 'R$ 28,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '112.000',
    percentualCarteira: '3.8%'
  },

  // ========================================
  // PETRÓLEO (3 ativos)
  // ========================================
  'RECV3': {
    ticker: 'RECV3',
    nomeCompleto: 'PetroRecôncavo S.A.',
    setor: 'Petróleo',
    descricao: 'A PetroRecôncavo é uma empresa brasileira de exploração e produção de petróleo e gás natural.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/RECV.png',
    dataEntrada: '23/07/2023',
    precoIniciou: 'R$ 22,29',
    precoTeto: 'R$ 31,37',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '125.000',
    percentualCarteira: '3.1%'
  },

  'PRIO3': {
    ticker: 'PRIO3',
    nomeCompleto: 'PetroRio S.A.',
    setor: 'Petróleo',
    descricao: 'A PetroRio é uma empresa brasileira independente de petróleo e gás, focada na Bacia de Campos.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/PRIO.png',
    dataEntrada: '04/08/2022',
    precoIniciou: 'R$ 23,35',
    precoTeto: 'R$ 48,70',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '115.000',
    percentualCarteira: '4.1%'
  },

  'PETR4': {
    ticker: 'PETR4',
    nomeCompleto: 'Petróleo Brasileiro S.A. - Petrobras',
    setor: 'Petróleo',
    descricao: 'A Petrobras é a maior empresa brasileira e uma das principais companhias de energia do mundo.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/PETR.png',
    dataEntrada: '20/05/2020',
    precoIniciou: 'R$ 18,45',
    precoTeto: 'R$ 35,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '82.000',
    percentualCarteira: '5.8%'
  },

  // ========================================
  // QUÍMICO (1 ativo)
  // ========================================
  'UNIP6': {
    ticker: 'UNIP6',
    nomeCompleto: 'Unipar Carbocloro S.A.',
    setor: 'Químico',
    descricao: 'A Unipar é uma das maiores empresas petroquímicas do Brasil, produtora de cloro, soda cáustica e PVC.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/UNIP.png',
    dataEntrada: '08/12/2020',
    precoIniciou: 'R$ 42,41',
    precoTeto: 'R$ 117,90',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '118.000',
    percentualCarteira: '4.9%'
  },

  // ========================================
  // SANEAMENTO (2 ativos)
  // ========================================
  'SAPR4': {
    ticker: 'SAPR4',
    nomeCompleto: 'Sanepar S.A.',
    setor: 'Saneamento',
    descricao: 'A Sanepar é a companhia de saneamento básico do Paraná, responsável pelos serviços de água e esgoto.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/SAPR.png',
    dataEntrada: '11/06/2020',
    precoIniciou: 'R$ 8,95',
    precoTeto: 'R$ 15,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '96.000',
    percentualCarteira: '2.8%'
  },

  'CSMG3': {
    ticker: 'CSMG3',
    nomeCompleto: 'Copasa MG S.A.',
    setor: 'Saneamento',
    descricao: 'A Copasa é a companhia de saneamento de Minas Gerais, prestando serviços de água e esgoto no estado.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/CSMG.png',
    dataEntrada: '18/12/2020',
    precoIniciou: 'R$ 12,80',
    precoTeto: 'R$ 22,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '119.500',
    percentualCarteira: '2.9%'
  },

  // ========================================
  // SAÚDE (2 ativos)
  // ========================================
  'FLRY3': {
    ticker: 'FLRY3',
    nomeCompleto: 'Fleury S.A.',
    setor: 'Saúde',
    descricao: 'A Fleury é uma das maiores empresas de medicina diagnóstica do Brasil, oferecendo exames laboratoriais e de imagem.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/FLRY.png',
    dataEntrada: '19/05/2022',
    precoIniciou: 'R$ 14,63',
    precoTeto: 'R$ 17,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '108.500',
    percentualCarteira: '2.5%'
  },

  'ODPV3': {
    ticker: 'ODPV3',
    nomeCompleto: 'Odontoprev S.A.',
    setor: 'Saúde',
    descricao: 'A Odontoprev é a maior empresa de planos odontológicos do Brasil, atendendo milhões de beneficiários.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ODPV.png',
    dataEntrada: '26/10/2021',
    precoIniciou: 'R$ 12,45',
    precoTeto: 'R$ 18,80',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '104.000',
    percentualCarteira: '2.3%'
  },

  // ========================================
  // SEGUROS (1 ativo)
  // ========================================
  'WIZC3': {
    ticker: 'WIZC3',
    nomeCompleto: 'Wiz Soluções e Corretagem de Seguros S.A.',
    setor: 'Seguros',
    descricao: 'A Wiz é uma das maiores corretoras de seguros do Brasil, oferecendo soluções completas em seguros e previdência.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/WIZC.png',
    dataEntrada: '07/07/2021',
    precoIniciou: 'R$ 9,85',
    precoTeto: 'R$ 16,20',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '131.000',
    percentualCarteira: '2.4%'
  },

  // ========================================
  // SUCROENERGÉTICO (2 ativos)
  // ========================================
  'SMTO3': {
    ticker: 'SMTO3',
    nomeCompleto: 'São Martinho S.A.',
    setor: 'Sucroenergético',
    descricao: 'A São Martinho é uma das maiores produtoras de açúcar e etanol do Brasil, com operações integradas.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/SMTO.png',
    dataEntrada: '10/11/2022',
    precoIniciou: 'R$ 28,20',
    precoTeto: 'R$ 35,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '109.000',
    percentualCarteira: '3.2%'
  },

  'JALL3': {
    ticker: 'JALL3',
    nomeCompleto: 'Jalles Machado S.A.',
    setor: 'Sucroenergético',
    descricao: 'A Jalles Machado é uma empresa brasileira produtora de açúcar, etanol e energia elétrica.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/JALL.png',
    dataEntrada: '04/04/2022',
    precoIniciou: 'R$ 16,80',
    precoTeto: 'R$ 24,50',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '117.000',
    percentualCarteira: '2.6%'
  },

  // ========================================
  // TECNOLOGIA (1 ativo)
  // ========================================
  'POSI3': {
    ticker: 'POSI3',
    nomeCompleto: 'Positivo Tecnologia S.A.',
    setor: 'Tecnologia',
    descricao: 'A Positivo Tecnologia é uma empresa brasileira fabricante de computadores, tablets e soluções educacionais.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/POSI.png',
    dataEntrada: '15/03/2021',
    precoIniciou: 'R$ 3,45',
    precoTeto: 'R$ 7,80',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '121.000',
    percentualCarteira: '1.6%'
  },

  // ========================================
  // TELECOM (1 ativo)
  // ========================================
  'VIVT3': {
    ticker: 'VIVT3',
    nomeCompleto: 'Telefônica Brasil S.A.',
    setor: 'Telecom',
    descricao: 'A Telefônica Brasil (Vivo) é a maior operadora de telecomunicações do país, oferecendo serviços móveis e fixos.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/VIVT.png',
    dataEntrada: '22/01/2023',
    precoIniciou: 'R$ 45,80',
    precoTeto: 'R$ 58,00',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '111.000',
    percentualCarteira: '4.6%'
  },

  // ========================================
  // ATIVO ORIGINAL MANTIDO
  // ========================================
  'ALOS3': {
    ticker: 'ALOS3',
    nomeCompleto: 'Allos S.A.',
    setor: 'Shoppings',
    descricao: 'A Allos é uma empresa de shopping centers, focada em empreendimentos de alto padrão.',
    avatar: 'https://www.ivalor.com.br/media/emp/logos/ALOS.png',
    dataEntrada: '15/01/2021',
    precoIniciou: 'R$ 26,68',
    precoTeto: 'R$ 23,76',
    viesAtual: 'Aguardar',
    ibovespaEpoca: '108.500',
    percentualCarteira: '4.2%'
  },

  // ========================================
  // FIIs - FUNDOS IMOBILIÁRIOS
  // ========================================
'MALL11': {
  ticker: 'MALL11',
  nomeCompleto: 'Shopping Centers Brasil Fundo de Investimento Imobiliário',
  setor: 'Shopping',
  descricao: 'Fundo de investimento imobiliário focado em shopping centers e centros comerciais.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/MALL.png',
  dataEntrada: '26/01/2022',
  precoIniciou: 'R$ 118,37',
  precoTeto: 'R$ 103,68',
  viesAtual: 'Compra',
  ibovespaEpoca: '112.000',
  percentualCarteira: '2.8%',
  tipo: 'FII',
  gestora: 'Vinci Partners',
  dyEsperado: '8.40%'
},

'KNSC11': {
  ticker: 'KNSC11',
  nomeCompleto: 'Kinea Securities Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário focado em recebíveis imobiliários.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/KNSC.png',
  dataEntrada: '24/05/2022',
  precoIniciou: 'R$ 9,31',
  precoTeto: 'R$ 9,16',
  viesAtual: 'Compra',
  ibovespaEpoca: '108.000',
  percentualCarteira: '2.2%',
  tipo: 'FII',
  gestora: 'Kinea',
  dyEsperado: '10.98%'
},

'KNHF11': {
  ticker: 'KNHF11',
  nomeCompleto: 'Kinea High Frequency Fundo de Investimento Imobiliário',
  setor: 'Hedge Fund',
  descricao: 'Fundo de investimento imobiliário com estratégia de hedge fund.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/KNHF.png',
  dataEntrada: '20/12/2024',
  precoIniciou: 'R$ 76,31',
  precoTeto: 'R$ 90,50',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '132.000',
  percentualCarteira: '3.5%',
  tipo: 'FII',
  gestora: 'Kinea',
  dyEsperado: '15.00%'
},

'HGBS11': {
  ticker: 'HGBS11',
  nomeCompleto: 'CSHG Brasil Shopping Fundo de Investimento Imobiliário',
  setor: 'Shopping',
  descricao: 'Fundo de investimento imobiliário focado em shopping centers no Brasil.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/HGBS.png',
  dataEntrada: '02/01/2025',
  precoIniciou: 'R$ 18,60',
  precoTeto: 'R$ 19,20',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '125.000',
  percentualCarteira: '2.1%',
  tipo: 'FII',
  gestora: 'CSHG Real Estate',
  dyEsperado: '10.50%'
},

'RURA11': {
  ticker: 'RURA11',
  nomeCompleto: 'Kinea Rura Fundo de Investimento Imobiliário',
  setor: 'Fiagro',
  descricao: 'Fundo de investimento imobiliário focado em ativos rurais e do agronegócio.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/RURA.png',
  dataEntrada: '14/02/2023',
  precoIniciou: 'R$ 10,25',
  precoTeto: 'R$ 8,70',
  viesAtual: 'Compra',
  ibovespaEpoca: '112.500',
  percentualCarteira: '2.7%',
  tipo: 'FII',
  gestora: 'Kinea',
  dyEsperado: '13.21%'
},

'BCIA11': {
  ticker: 'BCIA11',
  nomeCompleto: 'BTG Pactual Corporate Office Fundo de Investimento Imobiliário',
  setor: 'FoF',
  descricao: 'Fundo de fundo de investimento imobiliário diversificado.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/BCIA.png',
  dataEntrada: '12/04/2023',
  precoIniciou: 'R$ 82,28',
  precoTeto: 'R$ 87,81',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '104.000',
  percentualCarteira: '3.1%',
  tipo: 'FII',
  gestora: 'BTG Pactual',
  dyEsperado: '9.77%'
},

'BPFF11': {
  ticker: 'BPFF11',
  nomeCompleto: 'BTG Pactual Fundo de Fundos Fundo de Investimento Imobiliário',
  setor: 'FOF',
  descricao: 'Fundo de investimento imobiliário que investe em cotas de outros FIIs.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/BPFF.png',
  dataEntrada: '08/01/2024',
  precoIniciou: 'R$ 72,12',
  precoTeto: 'R$ 66,26',
  viesAtual: 'Compra',
  ibovespaEpoca: '134.000',
  percentualCarteira: '3.8%',
  tipo: 'FII',
  gestora: 'BTG Pactual',
  dyEsperado: '11.00%'
},

'HGFF11': {
  ticker: 'HGFF11',
  nomeCompleto: 'CSHG Fundo de Fundos Fundo de Investimento Imobiliário',
  setor: 'FoF',
  descricao: 'Fundo de investimento imobiliário diversificado através de cotas de outros FIIs.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/HGFF.png',
  dataEntrada: '03/04/2023',
  precoIniciou: 'R$ 69,15',
  precoTeto: 'R$ 73,59',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '103.500',
  percentualCarteira: '2.9%',
  tipo: 'FII',
  gestora: 'CSHG Real Estate',
  dyEsperado: '9.25%'
},

'BRCO11': {
  ticker: 'BRCO11',
  nomeCompleto: 'BTG Pactual Corporativo Fundo de Investimento Imobiliário',
  setor: 'Logística',
  descricao: 'Fundo de investimento imobiliário focado em ativos logísticos.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/BRCO.png',
  dataEntrada: '09/05/2022',
  precoIniciou: 'R$ 99,25',
  precoTeto: 'R$ 109,89',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '107.000',
  percentualCarteira: '3.2%',
  tipo: 'FII',
  gestora: 'BTG Pactual',
  dyEsperado: '8.44%'
},

'XPML11': {
  ticker: 'XPML11',
  nomeCompleto: 'XP Malls Fundo de Investimento Imobiliário',
  setor: 'Shopping',
  descricao: 'Fundo de investimento imobiliário especializado em shopping centers.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/XPML.png',
  dataEntrada: '16/02/2022',
  precoIniciou: 'R$ 93,32',
  precoTeto: 'R$ 110,40',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '111.000',
  percentualCarteira: '2.8%',
  tipo: 'FII',
  gestora: 'XP Asset Management',
  dyEsperado: '8.44%'
},

'HGLG11': {
  ticker: 'HGLG11',
  nomeCompleto: 'CSHG Logística Fundo de Investimento Imobiliário',
  setor: 'Logística',
  descricao: 'Fundo de investimento imobiliário focado em galpões logísticos e centros de distribuição.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/HGLG.png',
  dataEntrada: '20/06/2022',
  precoIniciou: 'R$ 161,80',
  precoTeto: 'R$ 146,67',
  viesAtual: 'Compra',
  ibovespaEpoca: '109.000',
  percentualCarteira: '3.4%',
  tipo: 'FII',
  gestora: 'CSHG Real Estate',
  dyEsperado: '8.44%'
},

'HSML11': {
  ticker: 'HSML11',
  nomeCompleto: 'HSI Mall Fundo de Investimento Imobiliário',
  setor: 'Shopping',
  descricao: 'Fundo de investimento imobiliário focado em shopping centers regionais.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/HSML.png',
  dataEntrada: '14/06/2022',
  precoIniciou: 'R$ 78,00',
  precoTeto: 'R$ 93,60',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '108.500',
  percentualCarteira: '2.5%',
  tipo: 'FII',
  gestora: 'HSI Asset Management',
  dyEsperado: '8.91%'
},

'VGIP11': {
  ticker: 'VGIP11',
  nomeCompleto: 'Valora Grupo Imobiliário Partners Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário focado em recebíveis imobiliários.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/VGIP.png',
  dataEntrada: '02/12/2021',
  precoIniciou: 'R$ 96,99',
  precoTeto: 'R$ 88,00',
  viesAtual: 'Compra',
  ibovespaEpoca: '104.500',
  percentualCarteira: '3.0%',
  tipo: 'FII',
  gestora: 'Valora',
  dyEsperado: '13.67%'
},

'AFHI11': {
  ticker: 'AFHI11',
  nomeCompleto: 'Alpha Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário focado em recebíveis imobiliários.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/AFHI.png',
  dataEntrada: '05/07/2022',
  precoIniciou: 'R$ 99,91',
  precoTeto: 'R$ 93,20',
  viesAtual: 'Compra',
  ibovespaEpoca: '110.500',
  percentualCarteira: '2.9%',
  tipo: 'FII',
  gestora: 'Alpha Capital',
  dyEsperado: '13.08%'
},

'BTLG11': {
  ticker: 'BTLG11',
  nomeCompleto: 'BTG Pactual Logística Fundo de Investimento Imobiliário',
  setor: 'Logística',
  descricao: 'Fundo de investimento imobiliário focado em ativos logísticos estratégicos.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/BTLG.png',
  dataEntrada: '05/01/2022',
  precoIniciou: 'R$ 103,14',
  precoTeto: 'R$ 104,00',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '103.000',
  percentualCarteira: '3.3%',
  tipo: 'FII',
  gestora: 'BTG Pactual',
  dyEsperado: '8.42%'
},

'VRTA11': {
  ticker: 'VRTA11',
  nomeCompleto: 'Vortx Renda Imobiliária Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário focado em recebíveis imobiliários.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/VRTA.png',
  dataEntrada: '27/12/2022',
  precoIniciou: 'R$ 88,30',
  precoTeto: 'R$ 94,33',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '109.500',
  percentualCarteira: '2.4%',
  tipo: 'FII',
  gestora: 'Vortx',
  dyEsperado: '9.66%'
},

'LVBI11': {
  ticker: 'LVBI11',
  nomeCompleto: 'Live Brasil Fundo de Investimento Imobiliário',
  setor: 'Logística',
  descricao: 'Fundo de investimento imobiliário focado em ativos logísticos.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/LVBI.png',
  dataEntrada: '18/10/2022',
  precoIniciou: 'R$ 113,85',
  precoTeto: 'R$ 122,51',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '115.000',
  percentualCarteira: '3.1%',
  tipo: 'FII',
  gestora: 'Live Capital',
  dyEsperado: '7.90%'
},

'HGRU11': {
  ticker: 'HGRU11',
  nomeCompleto: 'CSHG Renda Urbana Fundo de Investimento Imobiliário',
  setor: 'Renda Urbana',
  descricao: 'Fundo de investimento imobiliário focado em renda urbana e edifícios corporativos.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/HGRU.png',
  dataEntrada: '17/05/2022',
  precoIniciou: 'R$ 115,00',
  precoTeto: 'R$ 138,57',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '106.500',
  percentualCarteira: '3.2%',
  tipo: 'FII',
  gestora: 'CSHG Real Estate',
  dyEsperado: '8.44%'
},

'ALZR11': {
  ticker: 'ALZR11',
  nomeCompleto: 'Alianza Trust Renda Imobiliária Fundo de Investimento Imobiliário',
  setor: 'Híbrido',
  descricao: 'Fundo de investimento imobiliário com portfólio híbrido diversificado.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/ALZR.png',
  dataEntrada: '02/02/2022',
  precoIniciou: 'R$ 11,59',
  precoTeto: 'R$ 10,16',
  viesAtual: 'Compra',
  ibovespaEpoca: '110.000',
  percentualCarteira: '2.3%',
  tipo: 'FII',
  gestora: 'Alianza Trust',
  dyEsperado: '8.44%'
},

'BCRI11': {
  ticker: 'BCRI11',
  nomeCompleto: 'BTG Pactual Crédito Imobiliário Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário focado em créditos imobiliários e recebíveis.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/BCRI.png',
  dataEntrada: '25/11/2021',
  precoIniciou: 'R$ 104,53',
  precoTeto: 'R$ 87,81',
  viesAtual: 'Compra',
  ibovespaEpoca: '102.000',
  percentualCarteira: '3.0%',
  tipo: 'FII',
  gestora: 'BTG Pactual',
  dyEsperado: '13.22%'
},

'KNRI11': {
  ticker: 'KNRI11',
  nomeCompleto: 'Kinea Renda Imobiliária Fundo de Investimento Imobiliário',
  setor: 'Híbrido',
  descricao: 'Fundo de investimento imobiliário com estratégia híbrida.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/KNRI.png',
  dataEntrada: '27/06/2022',
  precoIniciou: 'R$ 131,12',
  precoTeto: 'R$ 146,67',
  viesAtual: 'Aguardar',
  ibovespaEpoca: '109.200',
  percentualCarteira: '3.6%',
  tipo: 'FII',
  gestora: 'Kinea',
  dyEsperado: '8.44%'
},

'IRDM11': {
  ticker: 'IRDM11',
  nomeCompleto: 'Iridium Recebíveis Imobiliários Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário especializado em recebíveis imobiliários.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/IRDM.png',
  dataEntrada: '05/01/2022',
  precoIniciou: 'R$ 107,04',
  precoTeto: 'R$ 73,20',
  viesAtual: 'Compra',
  ibovespaEpoca: '103.200',
  percentualCarteira: '2.8%',
  tipo: 'FII',
  gestora: 'Iridium Asset',
  dyEsperado: '11.55%'
},

'MXRF11': {
  ticker: 'MXRF11',
  nomeCompleto: 'Maxi Renda Fundo de Investimento Imobiliário',
  setor: 'Papel',
  descricao: 'Fundo de investimento imobiliário focado em recebíveis imobiliários.',
  avatar: 'https://www.ivalor.com.br/media/emp/logos/MXRF.png',
  dataEntrada: '12/07/2022',
  precoIniciou: 'R$ 9,69',
  precoTeto: 'R$ 9,40',
  viesAtual: 'Compra',
  ibovespaEpoca: '110.800',
  percentualCarteira: '2.1%',
  tipo: 'FII',
  gestora: 'Maxi Renda',
  dyEsperado: '13.35%'
}
};

const dadosFallback: Record<string, EmpresaCompleta> = Object.fromEntries(
  Object.entries(rawDadosFallback).map(([ticker, empresa]) => {
    const empresaComOverride: EmpresaCompleta = {
      ...empresa,
      viesOverride: 'AUTO'
    };

    return [ticker, empresaComOverride];
  })
);
// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================
function calcularViesSimplificado(
  precoTeto: string,
  precoAtual: number,
  override?: 'AUTO' | 'MANTER' | null
): string {
  try {
    const precoTetoNum = parseFloat(precoTeto.replace('R$ ', '').replace('.', '').replace(',', '.'));

    if (isNaN(precoTetoNum) || precoAtual <= 0) {
      return aplicarViesOverride(override, 'Aguardar');
    }

    const viesAutomatico = precoAtual < precoTetoNum ? 'Compra' : 'Aguardar';
    return aplicarViesOverride(override, viesAutomatico);
  } catch {
    return aplicarViesOverride(override, 'Aguardar');
  }
}

function formatarValor(valor: number | undefined, tipo: 'currency' | 'percent' | 'number' | 'millions' = 'currency'): string {
  if (valor === undefined || valor === null || isNaN(valor)) return 'N/A';
  
  switch (tipo) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valor);
    
    case 'percent':
      return `${valor.toFixed(2).replace('.', ',')}%`;
    
    case 'millions':
      if (valor >= 1000000000) {
        return `R$ ${(valor / 1000000000).toFixed(1).replace('.', ',')} bi`;
      } else if (valor >= 1000000) {
        return `R$ ${(valor / 1000000).toFixed(1).replace('.', ',')} mi`;
      } else {
        return formatarValor(valor, 'currency');
      }
    
    case 'number':
      return valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    
    default:
      return valor.toString();
  }
}
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

const logMobile = (message: string, data?: any) => {
  console.log(`📱 [MOBILE] ${message}`, data || '');
  
  // Mostrar logs na tela para debug mobile
  if (isMobile() && typeof window !== 'undefined') {
    const logDiv = document.getElementById('mobile-debug-log') || (() => {
      const div = document.createElement('div');
      div.id = 'mobile-debug-log';
      div.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 9999;
        background: rgba(0,0,0,0.8); color: white; padding: 8px;
        border-radius: 4px; font-size: 10px; max-width: 200px;
        max-height: 200px; overflow-y: auto; display: none;
      `;
      document.body.appendChild(div);
      return div;
    })();
    
    logDiv.innerHTML = `${new Date().toLocaleTimeString()}: ${message}<br/>` + logDiv.innerHTML;
    logDiv.style.display = 'block';
    
    // Auto-hide após 10 segundos
    setTimeout(() => {
      if (logDiv.children.length > 20) {
        logDiv.style.display = 'none';
      }
    }, 10000);
  }
};

// ========================================
// HOOK PARA CALCULAR DIVIDEND YIELD - NOVO!
// ========================================
function useDividendYield(ticker: string, dataEntrada: string, precoAtual?: number, precoIniciou?: string, isFII = false) {
  const [dyData, setDyData] = useState({
    dy12Meses: 0,
    dyDesdeEntrada: 0
  });

  const parsePreco = useCallback((precoStr: string): number => {
    try {
      return parseFloat(precoStr.replace('R$ ', '').replace('.', '').replace(',', '.'));
    } catch {
      return 0;
    }
  }, []);

  const calcularDY = useCallback(() => {
    if (!ticker || !precoAtual || precoAtual <= 0 || !precoIniciou || !dataEntrada) {
      setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
      return;
    }

    try {
      // ✅ CORREÇÃO: Buscar dados de múltiplas fontes
      let dadosSalvos = null;
      
      if (isFII) {
        // Para FIIs, tentar várias chaves possíveis
        dadosSalvos = localStorage.getItem(`dividendos_fii_${ticker}`) || 
                     localStorage.getItem(`proventos_${ticker}`) ||
                     localStorage.getItem(`rendimentos_${ticker}`);
      } else {
        // Para ações, usar a chave padrão
        dadosSalvos = localStorage.getItem(`proventos_${ticker}`);
      }

      // ✅ NOVO: Tentar buscar do sistema central como fallback
      if (!dadosSalvos) {
        const proventosCentral = localStorage.getItem('proventos_central_master');
        if (proventosCentral) {
          try {
            const todosDados = JSON.parse(proventosCentral);
            const dadosTicker = todosDados.filter((item: any) => item.ticker === ticker);
            if (dadosTicker.length > 0) {
              dadosSalvos = JSON.stringify(dadosTicker);
            }
          } catch (err) {
            console.error('Erro ao buscar do sistema central:', err);
          }
        }
      }
      
      if (!dadosSalvos) {
        console.log(`❌ Nenhum dado encontrado para ${ticker}`, {
          isFII,
          tentativas: [
            `dividendos_fii_${ticker}`,
            `proventos_${ticker}`,
            `rendimentos_${ticker}`,
            'proventos_central_master'
          ]
        });
        setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
        return;
      }

      const proventos = JSON.parse(dadosSalvos).map((item: any) => ({
        ...item,
        dataObj: new Date(item.dataCom || item.data || item.dataObj || item.dataFormatada)
      }));

      console.log(`✅ Dados encontrados para ${ticker}:`, {
        total: proventos.length,
        isFII,
        amostra: proventos.slice(0, 2)
      });

      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);

      const dataEntradaObj = new Date(dataEntrada.split('/').reverse().join('-'));
      const data12MesesAtras = new Date(hoje);
      data12MesesAtras.setFullYear(data12MesesAtras.getFullYear() - 1);
      data12MesesAtras.setHours(0, 0, 0, 0);

      const proventos12Meses = proventos.filter((provento: any) => {
        if (!provento.dataObj || isNaN(provento.dataObj.getTime())) {
          return false;
        }
        return provento.dataObj >= data12MesesAtras && provento.dataObj <= hoje;
      });

      const proventosDesdeEntrada = proventos.filter((provento: any) => 
        provento.dataObj && 
        !isNaN(provento.dataObj.getTime()) &&
        provento.dataObj >= dataEntradaObj && 
        provento.dataObj <= hoje
      );

      const totalProventos12Meses = proventos12Meses.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
      const totalProventosDesdeEntrada = proventosDesdeEntrada.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

      const dy12Meses = precoAtual > 0 ? (totalProventos12Meses / precoAtual) * 100 : 0;
      const precoEntrada = parsePreco(precoIniciou);
      const dyDesdeEntrada = precoEntrada > 0 ? (totalProventosDesdeEntrada / precoEntrada) * 100 : 0;

      console.log(`📊 DY calculado para ${ticker}:`, {
        dy12Meses: dy12Meses.toFixed(2) + '%',
        dyDesdeEntrada: dyDesdeEntrada.toFixed(2) + '%',
        proventos12Meses: proventos12Meses.length,
        proventosDesdeEntrada: proventosDesdeEntrada.length
      });

      setDyData({
        dy12Meses: isNaN(dy12Meses) ? 0 : dy12Meses,
        dyDesdeEntrada: isNaN(dyDesdeEntrada) ? 0 : dyDesdeEntrada
      });

    } catch (error) {
      console.error('Erro ao calcular DY:', error);
      setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
    }
  }, [ticker, precoAtual, precoIniciou, dataEntrada, parsePreco, isFII]);

  useEffect(() => {
    calcularDY();
  }, [calcularDY]);

  return dyData;
}
function useDadosFII(ticker: string, dadosFinanceiros?: DadosFinanceiros) {
  const [dadosFII, setDadosFII] = useState<DadosFII | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarDadosFII = useCallback(async () => {
    if (!ticker) return;
    
    try {
      setLoading(true);
      setError(null);
      logMobile(`🏢 Buscando dados FII: ${ticker}`);
      
      // ✅ PRIMEIRA TENTATIVA: Dados manuais
      const dadosManuais = localStorage.getItem(`dados_fii_${ticker}`);
      let dadosProcessados: DadosFII = { fonte: 'manual' };
      
      if (dadosManuais) {
        try {
          const dadosSalvos = JSON.parse(dadosManuais);
          dadosProcessados = { ...dadosSalvos, fonte: 'manual' };
          logMobile(`📝 Dados manuais encontrados`);
        } catch (err) {
          logMobile(`⚠️ Erro nos dados manuais: ${err.message}`);
        }
      }

      // ✅ SEGUNDA TENTATIVA: API apenas se não for mobile ou for WiFi
      const tentarAPI = !isMobile() || 
        (navigator.connection && navigator.connection.effectiveType === 'wifi') ||
        !navigator.connection;
        
      if (navigator.onLine && tentarAPI) {
        try {
          logMobile(`🌐 Tentando API FII para ${ticker}`);
          
          // Timeout muito curto para mobile
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            logMobile(`⏱️ Timeout API FII`);
          }, 1500); // 1.5s apenas

          const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&dividends=true`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'max-age=3600'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            logMobile(`✅ API FII respondeu`);
            
              if (data.results && data.results.length > 0) {
                const fii = data.results[0];
                const stats = fii || {};

                const ultimoDividendo =
                  stats.lastDividendValue ??
                  stats.dividendsData?.cashDividends?.[0]?.rate ??
                  stats.lastDividends?.[0]?.value ?? null;

                const dataUltimoDividendo =
                  stats.lastDividendDate ??
                  stats.dividendsData?.cashDividends?.[0]?.paymentDate ??
                  stats.lastDividends?.[0]?.paymentDate ??
                  stats.lastDividends?.[0]?.date ?? null;

                const dadosAPI = {
                  valorPatrimonial: stats.bookValue ?? stats.netAssetValue ?? null,
                  pvp: stats.priceToBook ?? stats.priceBook ?? null,
                  numeroCotas: stats.sharesOutstanding ?? stats.totalShares ?? null,
                  ultimoRendimento: ultimoDividendo,
                  dataUltimoRendimento: dataUltimoDividendo,
                  ultimaAtualizacao: new Date().toLocaleString('pt-BR')
                } as any;

                // Calcular patrimônio
                if (dadosAPI.valorPatrimonial && dadosAPI.numeroCotas) {
                  dadosAPI.patrimonio = dadosAPI.valorPatrimonial * dadosAPI.numeroCotas;
                }

              dadosProcessados = {
                ...dadosProcessados,
                ...dadosAPI,
                fonte: 'api'
              };

              logMobile(`📊 Dados API FII obtidos`);
            }
          }
        } catch (apiError) {
          logMobile(`❌ API FII falhou: ${apiError.message}`);
        }
      } else {
        logMobile(`📱 Mobile: pulando API FII`);
      }

      // ✅ TERCEIRA TENTATIVA: Dados de exemplo sempre disponíveis
      if (!dadosProcessados.valorPatrimonial) {
        logMobile(`🎯 Aplicando dados de exemplo para ${ticker}`);
        
        const dadosExemplo = {
          valorPatrimonial: ticker === 'MALL11' ? 100.25 :
                           ticker === 'HSML11' ? 95.50 :
                           ticker === 'HGBS11' ? 158.30 : 88.75,
          pvp: 0.88,
          valorMercado: 2200000000,
          valorCaixa: 150000000,
          numeroCotas: 26178644,
          ultimoRendimento: 0.75,
          dataUltimoRendimento: '2024-12-15',
          ultimaAtualizacao: 'Exemplo - ' + new Date().toLocaleString('pt-BR')
        };
        
        // Calcular patrimônio
        dadosExemplo.patrimonio = dadosExemplo.valorPatrimonial * dadosExemplo.numeroCotas;
        
        dadosProcessados = { 
          ...dadosProcessados, 
          ...dadosExemplo, 
          fonte: 'exemplo' as const 
        };
      }

      setDadosFII(dadosProcessados);
      logMobile(`✅ Dados FII finalizados para ${ticker}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logMobile(`💥 Erro geral FII: ${errorMessage}`);
      setError(errorMessage);
      
      // Em caso de erro, pelo menos estrutura básica
      setDadosFII({ fonte: 'manual' });
    } finally {
      setLoading(false);
    }
  }, [ticker, dadosFinanceiros]);

  const salvarDadosManuais = useCallback((dadosManuais: Partial<DadosFII>) => {
    try {
      const dadosParaSalvar = {
        dyCagr3Anos: dadosManuais.dyCagr3Anos,
        numeroCotistas: dadosManuais.numeroCotistas
      };
      
      localStorage.setItem(`dados_fii_${ticker}`, JSON.stringify(dadosParaSalvar));
      
      setDadosFII(prev => ({
        ...prev,
        ...dadosParaSalvar,
        fonte: prev?.fonte === 'api' ? 'misto' : prev?.fonte || 'manual'
      }));
      
      logMobile(`💾 Dados manuais salvos para ${ticker}`);
    } catch (error) {
      logMobile(`⚠️ Erro ao salvar: ${error.message}`);
    }
  }, [ticker]);

  const definirDadosTeste = useCallback(() => {
    const dadosTeste: DadosFII = {
      valorPatrimonial: 100.25,
      pvp: 0.88,
      patrimonio: 2625000000,
      valorMercado: 2200000000,
      valorCaixa: 150000000,
      numeroCotas: 26178644,
      ultimoRendimento: 0.75,
      dataUltimoRendimento: '2024-12-15',
      dyCagr3Anos: 8.5,
      numeroCotistas: 12500,
      fonte: 'teste',
      ultimaAtualizacao: new Date().toLocaleString('pt-BR')
    };
    
    setDadosFII(dadosTeste);
    logMobile(`🧪 Dados de teste aplicados para ${ticker}`);
  }, [ticker]);

  useEffect(() => {
    buscarDadosFII();
  }, [buscarDadosFII]);

  return { dadosFII, loading, error, refetch: buscarDadosFII, salvarDadosManuais, definirDadosTeste };
}

// ========================================
// HOOK PERSONALIZADO - DADOS FINANCEIROS
// ========================================
function useDadosFinanceiros(ticker: string) {
  const [dadosFinanceiros, setDadosFinanceiros] = useState<DadosFinanceiros | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');

  const buscarDados = React.useCallback(async () => {
    if (!ticker) return;

    try {
      setLoading(true);
      setError(null);
      logMobile(`🔍 Iniciando busca: ${ticker}`);

      // ✅ PRIMEIRA TENTATIVA: Verificar cache primeiro
      try {
        const cachedData = localStorage.getItem(`cache_${ticker}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed.timestamp && (Date.now() - parsed.timestamp) < 6 * 60 * 60 * 1000) { // 6 horas
            setDadosFinanceiros(parsed.data);
            setUltimaAtualizacao('Cache: ' + new Date(parsed.timestamp).toLocaleString('pt-BR'));
            logMobile(`📦 Cache válido encontrado para ${ticker}`);
            setLoading(false);
            return; // ✅ Usar cache se estiver válido
          }
        }
      } catch (cacheError) {
        logMobile(`⚠️ Erro no cache: ${cacheError.message}`);
      }

      // ✅ SEGUNDA TENTATIVA: API apenas se for desktop ou WiFi
      const isGoodConnection = !isMobile() || 
        (navigator.connection && ['wifi', '4g'].includes(navigator.connection.effectiveType)) ||
        !navigator.connection;
      
      if (navigator.onLine && isGoodConnection) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            logMobile(`⏱️ Timeout de API (${isMobile() ? '2s' : '8s'})`);
          }, isMobile() ? 2000 : 8000);

          const quoteUrl = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&dividends=true`;
          logMobile(`🌐 Tentando API: ${ticker}`);
          
          const response = await fetch(quoteUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': isMobile() ? 'Portfolio-Mobile/1.0' : 'Portfolio-Desktop/1.0',
              'Cache-Control': isMobile() ? 'max-age=3600' : 'no-cache'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            logMobile(`✅ API funcionou para ${ticker}`);

            if (data.results && data.results.length > 0) {
              const quote = data.results[0];
              const { valor: dyCalculado, origem: origemDy } = calcularDyAPartirDoResultado(quote, ticker);
              const dyPercentual = dyCalculado && dyCalculado > 0 ? dyCalculado * 100 : 0;

              if (dyPercentual > 0) {
                logMobile(`✅ [DY] ${ticker}: ${dyPercentual.toFixed(2)}% (${origemDy})`);
              } else {
                logMobile(`❌ [DY] ${ticker}: Sem dividendos (${origemDy})`);
              }

              const dadosProcessados: DadosFinanceiros = {
                precoAtual: quote.regularMarketPrice || quote.currentPrice || 0,
                variacao: quote.regularMarketChange || 0,
                variacaoPercent: quote.regularMarketChangePercent || 0,
                volume: quote.regularMarketVolume || 0,
                dy: dyPercentual,
                marketCap: quote.marketCap,
                pl: quote.priceEarnings
              };

              setDadosFinanceiros(dadosProcessados);
              setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
              
              // Salvar no cache
              try {
                localStorage.setItem(`cache_${ticker}`, JSON.stringify({
                  data: dadosProcessados,
                  timestamp: Date.now()
                }));
                logMobile(`💾 Dados salvos no cache`);
              } catch (storageError) {
                logMobile(`⚠️ Erro ao salvar cache: ${storageError.message}`);
              }
              
              setLoading(false);
              return;
            }
          } else {
            logMobile(`❌ API retornou erro: ${response.status}`);
          }
        } catch (apiError) {
          logMobile(`❌ Falha na API: ${apiError.message}`);
        }
      } else {
        logMobile(`📶 Conexão ruim ou offline, pulando API`);
      }

      // ✅ TERCEIRA TENTATIVA: Dados estáticos baseados no ticker
      logMobile(`🔄 Usando dados estáticos para ${ticker}`);
      
      const dadosEstaticos: DadosFinanceiros = {
        precoAtual: ticker === 'MALL11' ? 100.00 : 
                   ticker === 'HSML11' ? 95.50 :
                   ticker === 'HGBS11' ? 128.30 : 85.75,
        variacao: 1.50,
        variacaoPercent: 1.52,
        volume: 1000000,
        dy: isTickerFII(ticker) ? 8.5 : 4.2, // FII vs Ação
        marketCap: isTickerFII(ticker) ? 2200000000 : 15000000000,
        pl: isTickerFII(ticker) ? undefined : 12.5
      };
      
      setDadosFinanceiros(dadosEstaticos);
      setUltimaAtualizacao('Dados estáticos - ' + new Date().toLocaleString('pt-BR'));
      logMobile(`📊 Dados estáticos aplicados`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logMobile(`💥 Erro geral: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  return { dadosFinanceiros, loading, error, ultimaAtualizacao, refetch: buscarDados };
}

// ========================================
// COMPONENTE DE MÉTRICA
// ========================================
const MetricCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  loading = false,
  trend,
  showInfo = false
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  loading?: boolean;
  trend?: 'up' | 'down';
  showInfo?: boolean;
}) => (
  <Card sx={{ 
    borderRadius: 3,
    overflow: 'hidden',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    '&:hover': { 
      transform: 'translateY(-4px)', 
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)' 
    },
    height: '100%'
  }}>
    <Box sx={{ 
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      py: 2,
      px: 2.5,
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" sx={{ 
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: '#64748b'
        }}>
          {title}
        </Typography>
        {showInfo && (
          <Box sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%', 
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#64748b',
            backgroundColor: 'white'
          }}>
            ?
          </Box>
        )}
      </Stack>
    </Box>

    <CardContent sx={{ 
      backgroundColor: 'white',
      p: 3,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      '&:last-child': { pb: 3 }
    }}>
      {loading ? (
        <Skeleton variant="text" height={50} />
      ) : (
        <>
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            fontSize: '2rem',
            color: trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#1e293b',
            lineHeight: 1,
            letterSpacing: '-0.5px'
          }}>
            {value}
          </Typography>
          
          {subtitle && (
            <Typography variant="caption" sx={{ 
              color: '#64748b',
              fontSize: '0.75rem',
              display: 'block',
              mt: 1,
              lineHeight: 1.3,
              fontWeight: 500
            }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </CardContent>
  </Card>
));

// ========================================
// COMPONENTE HISTÓRICO DE DIVIDENDOS
// ========================================
const HistoricoDividendos = React.memo(({ ticker, dataEntrada, isFII = false }: { ticker: string; dataEntrada: string; isFII?: boolean }) => {
  const [proventos, setProventos] = useState<any[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    if (ticker && typeof window !== 'undefined') {
      let dadosSalvos = null;
      
      // ✅ CORREÇÃO: Buscar dados de múltiplas fontes possíveis
      if (isFII) {
        // Para FIIs, tentar várias chaves possíveis
        dadosSalvos = localStorage.getItem(`dividendos_fii_${ticker}`) || 
                     localStorage.getItem(`proventos_${ticker}`) ||
                     localStorage.getItem(`rendimentos_${ticker}`);
        
        console.log(`🔍 Buscando dados FII para ${ticker}:`, {
          dividendos_fii: !!localStorage.getItem(`dividendos_fii_${ticker}`),
          proventos: !!localStorage.getItem(`proventos_${ticker}`),
          rendimentos: !!localStorage.getItem(`rendimentos_${ticker}`)
        });
      } else {
        // Para ações, usar a chave padrão
        dadosSalvos = localStorage.getItem(`proventos_${ticker}`);
      }

      // ✅ NOVO: Buscar do sistema central como fallback
      if (!dadosSalvos) {
        const proventosCentral = localStorage.getItem('proventos_central_master');
        if (proventosCentral) {
          try {
            const todosDados = JSON.parse(proventosCentral);
            const dadosTicker = todosDados.filter((item: any) => item.ticker === ticker);
            if (dadosTicker.length > 0) {
              dadosSalvos = JSON.stringify(dadosTicker);
              console.log(`✅ Dados encontrados no sistema central para ${ticker}:`, dadosTicker.length);
            }
          } catch (err) {
            console.error('Erro ao buscar do sistema central:', err);
          }
        }
      }
      
      if (dadosSalvos) {
        try {
          const proventosSalvos = JSON.parse(dadosSalvos);

          const normalizarData = (valor: any) => {
            if (!valor) return '';

            const tentarConverter = (entrada: any) => {
              const data = new Date(entrada);
              return !isNaN(data.getTime()) ? data.toISOString().split('T')[0] : '';
            };

            if (valor instanceof Date) {
              return tentarConverter(valor);
            }

            if (typeof valor === 'string') {
              const viaDate = tentarConverter(valor);
              if (viaDate) return viaDate;

              const partes = valor.split('/');
              if (partes.length === 3) {
                const [dia, mes, ano] = partes.map(Number);
                const data = new Date(ano, mes - 1, dia);
                if (!isNaN(data.getTime())) return data.toISOString().split('T')[0];
              }

              return valor.trim();
            }

            if (typeof valor === 'number') {
              return tentarConverter(valor);
            }

            return '';
          };

          const normalizarValor = (valor: any) => {
            const numero = typeof valor === 'string' ? Number(valor.replace(',', '.')) : Number(valor);
            return Number.isFinite(numero) ? numero.toFixed(6) : String(valor ?? '');
          };

          const proventosLimitados = proventosSalvos.slice(0, 500).map((item: any) => ({
            ...item,
            dataObj: new Date(item.dataCom || item.data || item.dataObj || item.dataFormatada)
          }));

          // Filtrar dados inválidos
          const proventosValidos = proventosLimitados.filter((item: any) =>
            item.dataObj && !isNaN(item.dataObj.getTime()) && item.valor && item.valor > 0
          );

          // Remover duplicidades quando data com, pagamento e valor são iguais
          const combinacoesVistas = new Set<string>();
          const proventosUnicos = proventosValidos.filter((item: any) => {
            const dataComKey =
              normalizarData(item.dataCom) ||
              normalizarData(item.data) ||
              normalizarData(item.dataFormatada) ||
              normalizarData(item.dataObj);

            const dataPagamentoKey =
              normalizarData(item.dataPagamento) ||
              normalizarData(item.dataPagamentoFormatada);

            const valorKey = normalizarValor(item.valor);

            const chave = dataComKey && dataPagamentoKey && valorKey
              ? `${dataComKey}|${dataPagamentoKey}|${valorKey}`
              : null;

            if (!chave) return true;
            if (combinacoesVistas.has(chave)) return false;

            combinacoesVistas.add(chave);
            return true;
          });

          proventosUnicos.sort((a, b) => b.dataObj.getTime() - a.dataObj.getTime());
          setProventos(proventosUnicos);

          console.log(`✅ Proventos carregados para ${ticker}:`, {
            total: proventosUnicos.length,
            isFII,
            primeiros2: proventosUnicos.slice(0, 2)
          });
          
        } catch (err) {
          console.error('Erro ao carregar proventos salvos:', err);
          setProventos([]);
        }
      } else {
        console.log(`❌ Nenhum dado encontrado para ${ticker}. Chaves verificadas:`, {
          localStorage_keys: Object.keys(localStorage).filter(key => 
            key.includes(ticker) || key.includes('provento') || key.includes('dividendo')
          )
        });
        setProventos([]);
      }
    }
  }, [ticker, isFII]);

  const { totalProventos, mediaProvento, ultimoProvento } = useMemo(() => {
    const total = proventos.reduce((sum, item) => sum + item.valor, 0);
    const media = proventos.length > 0 ? total / proventos.length : 0;
    const ultimo = proventos.length > 0 ? proventos[0] : null;

    return {
      totalProventos: total,
      mediaProvento: media,
      ultimoProvento: ultimo
    };
  }, [proventos]);

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isFII ? '💰 Histórico de Rendimentos (FII)' : '💰 Histórico de Proventos'}
          </Typography>
        </Stack>

        {proventos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">
              {isFII ? `❌ Nenhum rendimento carregado para ${ticker}` : `❌ Nenhum provento carregado para ${ticker}`}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              📅 Data de entrada: {dataEntrada}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0f9ff', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                    {proventos.length}
                  </Typography>
                  <Typography variant="caption">Pagamentos</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0fdf4', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                    {formatarValor(totalProventos).replace('R$ ', '')}
                  </Typography>
                  <Typography variant="caption">Total</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fefce8', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#eab308' }}>
                    {formatarValor(mediaProvento).replace('R$ ', '')}
                  </Typography>
                  <Typography variant="caption">Média</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fdf4ff', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#a855f7' }}>
                    {ultimoProvento ? 
                      (ultimoProvento.dataFormatada?.replace(/\/\d{4}/, '') || 
                       ultimoProvento.dataObj.toLocaleDateString('pt-BR').replace(/\/\d{4}/, '')) : 'N/A'}
                  </Typography>
                  <Typography variant="caption">Último</Typography>
                </Box>
              </Grid>
            </Grid>
            
            {proventos.length > 10 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMostrarTodos(!mostrarTodos)}
                  sx={{
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                      borderColor: '#cbd5e1'
                    }
                  }}
                >
                  {mostrarTodos 
                    ? `📋 Mostrar apenas 10 recentes` 
                    : `📋 Mostrar todos os ${proventos.length} proventos`
                  }
                </Button>
              </Box>
            )}

            <TableContainer sx={{ 
              backgroundColor: 'white', 
              borderRadius: 1,
              maxHeight: mostrarTodos ? '400px' : 'auto',
              overflowY: mostrarTodos ? 'auto' : 'visible'
            }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Ativo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Valor</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Data Com</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Pagamento</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>DY</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                 {(mostrarTodos ? proventos : proventos.slice(0, 10)).map((provento, index) => (
                    <TableRow key={`${provento.data || provento.dataCom}-${index}`}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {ticker}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#22c55e' }}>
                        {provento.valorFormatado || formatarValor(provento.valor)}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 500 }}>
                        {provento.dataComFormatada || 
                         provento.dataFormatada || 
                         provento.dataObj?.toLocaleDateString('pt-BR') || 
                         'N/A'}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 500 }}>
                        {provento.dataPagamentoFormatada || 
                         provento.dataFormatada || 
                         provento.dataObj?.toLocaleDateString('pt-BR') || 
                         'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={provento.tipo || (isFII ? 'Rendimento' : 'Dividendo')}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          {provento.dividendYield ? `${(!isFII && provento.dividendYield > 0 && provento.dividendYield < 1 ? provento.dividendYield * 100 : provento.dividendYield).toFixed(2)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {proventos.length > 10 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {mostrarTodos 
                  ? `Mostrando todos os ${proventos.length} proventos com rolagem`
                  : `Mostrando os 10 mais recentes • Total: ${proventos.length}`
                }
              </Typography>
            </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
// ========================================
// COMPONENTE GERENCIADOR DE RELATÓRIOS
// ========================================
// ========================================
// ========================================
// GERENCIADOR DE RELATÓRIOS - VERSÃO CENTRALIZADA COMPLETA
// ========================================
const calcularHash = async (arquivo: File): Promise<string> => {
  const buffer = await arquivo.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const processarPdfHibrido = async (arquivo: File) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve({
        arquivoPdf: reader.result as string,
        nomeArquivoPdf: arquivo.name,
        tamanhoArquivo: arquivo.size,
        dataUploadPdf: new Date().toISOString()
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
};
const GerenciadorRelatorios = React.memo(({ ticker }: { ticker: string }) => {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [dialogVisualizacao, setDialogVisualizacao] = useState(false);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<Relatorio | null>(null);
  const [loadingIframe, setLoadingIframe] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  
  // Estados para re-upload de PDFs grandes
  const [dialogReupload, setDialogReupload] = useState(false);
  const [relatorioReupload, setRelatorioReupload] = useState<Relatorio | null>(null);
  const [arquivoReupload, setArquivoReupload] = useState<File | null>(null);

  // ✅ CARREGAMENTO CENTRALIZADO (mas interface limpa)
  useEffect(() => {
    carregarRelatoriosCentralizados();
    
    // Listener para mudanças no localStorage (sincronização em tempo real)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'relatorios_central') {
        carregarRelatoriosCentralizados();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [ticker]);

  const carregarRelatoriosCentralizados = useCallback(() => {
    try {
      const dadosCentralizados = localStorage.getItem('relatorios_central');
      
      if (dadosCentralizados) {
        const dados = JSON.parse(dadosCentralizados);
        const relatoriosTicker = dados[ticker] || [];
        
        // Converter para formato compatível
        const relatoriosFormatados = relatoriosTicker.map((rel: any) => ({
          ...rel,
          arquivo: rel.arquivoPdf ? 'PDF_CENTRALIZADO' : undefined,
          tamanho: rel.tamanhoArquivo ? `${(rel.tamanhoArquivo / 1024 / 1024).toFixed(1)} MB` : undefined
        }));
        
        setRelatorios(relatoriosFormatados);
      } else {
        setRelatorios([]);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setRelatorios([]);
    }
  }, [ticker]);

  // Re-upload para PDFs grandes
  const handleReuploadPdf = useCallback(async (arquivo: File, relatorio: Relatorio) => {
    try {
      if (relatorio.hashArquivo) {
        const novoHash = await calcularHash(arquivo);
        if (novoHash !== relatorio.hashArquivo) {
          if (!confirm('⚠️ O arquivo selecionado parece ser diferente do original. Continuar mesmo assim?')) {
            return;
          }
        }
      }

      const dadosPdf = await processarPdfHibrido(arquivo);
      const dadosCentralizados = JSON.parse(localStorage.getItem('relatorios_central') || '{}');
      
      if (dadosCentralizados[ticker]) {
        const index = dadosCentralizados[ticker].findIndex((r: any) => r.id === relatorio.id);
        if (index !== -1) {
          dadosCentralizados[ticker][index] = {
            ...dadosCentralizados[ticker][index],
            ...dadosPdf,
            solicitarReupload: false
          };
          
          localStorage.setItem('relatorios_central', JSON.stringify(dadosCentralizados));
          carregarRelatoriosCentralizados();
          
          setDialogReupload(false);
          setArquivoReupload(null);
          setRelatorioReupload(null);
          
          alert('✅ PDF atualizado com sucesso!');
        }
      }
      
    } catch (error) {
      console.error('Erro no re-upload:', error);
      alert('❌ Erro ao processar arquivo');
    }
  }, [ticker, carregarRelatoriosCentralizados]);

  // Download de PDF
  const baixarPdf = useCallback((relatorio: Relatorio) => {
    if (!relatorio.arquivoPdf) {
      if (relatorio.solicitarReupload) {
        setRelatorioReupload(relatorio);
        setDialogReupload(true);
        return;
      } else {
        alert('❌ Arquivo PDF não encontrado!');
        return;
      }
    }
    
    try {
      const link = document.createElement('a');
      link.href = relatorio.arquivoPdf;
      link.download = relatorio.nomeArquivoPdf || `${relatorio.nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #22c55e; color: white;
        padding: 12px 20px; border-radius: 8px; z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      toast.textContent = '📥 Download iniciado!';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
    } catch (error) {
      alert('❌ Erro ao baixar o arquivo. Tente novamente.');
    }
  }, []);

  const getIconePorTipo = useCallback((tipo: string) => {
    switch (tipo) {
      case 'iframe': return '🖼️';
      case 'canva': return '🎨';
      case 'link': return '🔗';
      case 'pdf': return '📄';
      default: return '📄';
    }
  }, []);

  // ✅ INTERFACE LIMPA - SEM REFERÊNCIAS AO SISTEMA CENTRAL
  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📋 Relatórios da Empresa
          </Typography>
          {/* Interface limpa - sem botões de sistema central */}
        </Stack>

        {relatorios.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">
              Nenhum relatório cadastrado para {ticker}
            </Typography>
          </Box>
        ) : (
          <List>
            {relatorios.map((relatorio) => (
              <ListItem key={relatorio.id} sx={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: 2, 
                mb: 1,
                backgroundColor: 'white',
                '&:hover': { backgroundColor: '#f8fafc' }
              }}>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>{getIconePorTipo(relatorio.tipoVisualizacao)}</span>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {relatorio.nome}
                      </Typography>
                      {relatorio.solicitarReupload && (
                        <Chip 
                          label="Re-upload" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {relatorio.tipo} • {relatorio.dataReferencia}
                      </Typography>
                      {relatorio.tamanhoArquivo && (
                        <Typography variant="caption" color="text.secondary">
                          📊 {(relatorio.tamanhoArquivo / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      )}
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    {/* Botão de visualização */}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setRelatorioSelecionado(relatorio);
                        setDialogVisualizacao(true);
                        setLoadingIframe(true);
                        setTimeoutError(false);
                      }}
                      sx={{ 
                        backgroundColor: '#e3f2fd', 
                        '&:hover': { backgroundColor: '#bbdefb' }
                      }}
                      title="Visualizar conteúdo"
                    >
                      <ViewIcon />
                    </IconButton>
                    
                    {/* Botão de download/re-upload */}
                    {(relatorio.arquivoPdf || relatorio.nomeArquivoPdf) && (
                      <Button
                        variant="contained"
                        color={relatorio.solicitarReupload ? "warning" : "success"}
                        size="small"
                        onClick={() => baixarPdf(relatorio)}
                        startIcon={relatorio.solicitarReupload ? <UploadIcon /> : <DownloadIconCustom />}
                        sx={{ minWidth: 'auto', px: 2 }}
                        title={relatorio.solicitarReupload ? "Re-upload necessário" : "Baixar PDF"}
                      >
                        {relatorio.solicitarReupload ? 'Upload' : 'PDF'}
                      </Button>
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Dialog de visualização */}
        <Dialog 
          open={dialogVisualizacao} 
          onClose={() => {
            setDialogVisualizacao(false);
            setLoadingIframe(false);
            setTimeoutError(false);
            setRelatorioSelecionado(null);
          }} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{ 
            sx: { 
              height: '95vh',
              backgroundColor: '#f8fafc'
            } 
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 2,
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getIconePorTipo(relatorioSelecionado?.tipoVisualizacao || '')} 
                {relatorioSelecionado?.nome}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {relatorioSelecionado?.tipo} • {relatorioSelecionado?.dataReferencia}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              {relatorioSelecionado && (
                <IconButton 
                  onClick={() => {
                    const src = relatorioSelecionado.tipoVisualizacao === 'canva' 
                      ? relatorioSelecionado.linkCanva 
                      : relatorioSelecionado.linkExterno;
                    if (src) window.open(src, '_blank');
                  }}
                  title="Abrir em nova aba"
                >
                  🔗
                </IconButton>
              )}
              <IconButton 
                onClick={() => {
                  setDialogVisualizacao(false);
                  setLoadingIframe(false);
                  setTimeoutError(false);
                  setRelatorioSelecionado(null);
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, height: '100%', backgroundColor: '#f8fafc' }}>
            {relatorioSelecionado && (
              <Box sx={{ position: 'relative', height: '80vh' }}>
                {loadingIframe && !timeoutError && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    textAlign: 'center'
                  }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Carregando conteúdo...
                    </Typography>
                  </Box>
                )}

                {timeoutError && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    textAlign: 'center',
                    maxWidth: 400,
                    p: 3
                  }}>
                    <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                      ⚠️ Erro ao Carregar
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                      O conteúdo não pôde ser carregado.
                    </Typography>
                    
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button 
                        variant="outlined"
                        onClick={() => {
                          setTimeoutError(false);
                          setLoadingIframe(true);
                        }}
                        size="small"
                      >
                        🔄 Tentar Novamente
                      </Button>
                      <Button 
                        variant="contained"
                        onClick={() => {
                          const src = relatorioSelecionado.tipoVisualizacao === 'canva' 
                            ? relatorioSelecionado.linkCanva 
                            : relatorioSelecionado.linkExterno;
                          if (src) window.open(src, '_blank');
                        }}
                        size="small"
                      >
                        🔗 Abrir em Nova Aba
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Iframe principal */}
                <iframe
                  src={(() => {
                    const relatorio = relatorioSelecionado;
                    
                    let url = '';
                    if (relatorio.tipoVisualizacao === 'canva') {
                      url = relatorio.linkCanva || '';
                    } else {
                      url = relatorio.linkExterno || '';
                    }
                    
                    if (!url) return '';
                    
                    // Processar Canva automaticamente
                    if (url.includes('canva.com')) {
                      if (url.includes('?embed')) return url;
                      if (url.includes('/view')) return url + '?embed';
                      if (url.includes('/design/')) return url.replace(/\/(edit|preview).*$/, '/view?embed');
                    }
                    
                    return url;
                  })()}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none', 
                    borderRadius: '8px',
                    opacity: timeoutError ? 0.3 : 1
                  }}
                  allowFullScreen
                  onLoad={() => {
                    setLoadingIframe(false);
                    setTimeoutError(false);
                  }}
                  onError={() => {
                    setLoadingIframe(false);
                    setTimeoutError(true);
                  }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {!loadingIframe && !timeoutError && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16,
                    zIndex: 1
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const src = relatorioSelecionado.tipoVisualizacao === 'canva' 
                          ? relatorioSelecionado.linkCanva 
                          : relatorioSelecionado.linkExterno;
                        if (src) window.open(src, '_blank');
                      }}
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                      }}
                      title="Abrir em nova aba"
                    >
                      🔗
                    </IconButton>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de re-upload */}
        <Dialog open={dialogReupload} onClose={() => setDialogReupload(false)} maxWidth="sm" fullWidth>
          <DialogTitle>📤 Re-upload de PDF</DialogTitle>
          <DialogContent>
            {relatorioReupload && (
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>📁 PDF Grande Detectado:</strong><br/>
                    • <strong>Arquivo:</strong> {relatorioReupload.nomeArquivoPdf}<br/>
                    • <strong>Tamanho:</strong> {relatorioReupload.tamanhoArquivo ? (relatorioReupload.tamanhoArquivo / 1024 / 1024).toFixed(2) : 'N/A'} MB<br/>
                    • <strong>Motivo:</strong> PDFs >3MB são armazenados como referência
                  </Typography>
                </Alert>
                
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="reupload-pdf-input"
                  type="file"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo && arquivo.size <= 10 * 1024 * 1024) {
                      setArquivoReupload(arquivo);
                    } else {
                      alert('Arquivo muito grande! Máximo 10MB.');
                    }
                  }}
                />
                <label htmlFor="reupload-pdf-input">
                  <Button component="span" variant="contained" startIcon={<CloudUploadIconCustom />} fullWidth>
                    {arquivoReupload ? '✅ Arquivo Selecionado' : '📁 Selecionar PDF'}
                  </Button>
                </label>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogReupload(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (arquivoReupload && relatorioReupload) {
                  handleReuploadPdf(arquivoReupload, relatorioReupload);
                }
              }}
              disabled={!arquivoReupload}
            >
              📤 Fazer Upload
            </Button>
          </DialogActions>
        </Dialog>

      </CardContent>
    </Card>
  );
});
// ========================================
// COMPONENTE AGENDA CORPORATIVA - CORRIGIDO PARA USAR CENTRAL
// ========================================
// ========================================
// COMPONENTE AGENDA CORPORATIVA - CORRIGIDO PARA USAR CENTRAL
// ========================================
const AgendaCorporativa = React.memo(({ ticker, isFII = false }: { ticker: string; isFII?: boolean }) => {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Função para calcular dias até o evento
  const calcularDiasAteEvento = useCallback((dataEvento: Date) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const evento = new Date(dataEvento);
    evento.setHours(0, 0, 0, 0);
    
    const diffTime = evento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []);

  // Função para formatar a proximidade do evento
  const formatarProximidade = useCallback((dias: number) => {
    if (dias < 0) return 'Passou';
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    if (dias <= 7) return `Em ${dias} dias`;
    if (dias <= 30) return `Em ${Math.ceil(dias / 7)} semanas`;
    return `Em ${Math.ceil(dias / 30)} meses`;
  }, []);

  // 🔄 Função principal para carregar eventos - CORRIGIDA
  const carregarEventos = useCallback(() => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 🔄 BUSCAR DADOS DA CENTRAL DA AGENDA (CORRIGIDO)
      const agendaCorporativaCentral = localStorage.getItem('agenda_corporativa_central');
      
      const debug = {
        ticker,
        isFII,
        agendaCentralExiste: !!agendaCorporativaCentral,
        agendaCentralSize: agendaCorporativaCentral ? agendaCorporativaCentral.length : 0,
        dadosRaw: null,
        eventosTicker: null,
        eventosValidos: [],
        erros: []
      };

      console.log(`🔍 [DEBUG] Carregando eventos da CENTRAL para ${ticker}:`, debug);

      if (!agendaCorporativaCentral) {
        debug.erros.push('localStorage agenda_corporativa_central não encontrado - use /central-agenda para fazer upload do CSV');
        setDebugInfo(debug);
        setEventos([]);
        setLoading(false);
        return;
      }

      let dadosAgenda;
      try {
        dadosAgenda = JSON.parse(agendaCorporativaCentral);
        debug.dadosRaw = dadosAgenda;
      } catch (parseError) {
        debug.erros.push(`Erro ao fazer parse do JSON: ${parseError.message}`);
        setDebugInfo(debug);
        setEventos([]);
        setLoading(false);
        return;
      }

      // 🎯 FILTRAR EVENTOS DO TICKER ESPECÍFICO (CORRIGIDO)
      const eventosTicker = Array.isArray(dadosAgenda) 
        ? dadosAgenda.filter((evento: any) => evento.ticker === ticker)
        : [];

      debug.eventosTicker = eventosTicker;

      if (eventosTicker.length === 0) {
        debug.erros.push(`Nenhum evento encontrado para ticker ${ticker} na central`);
        
        // Mostrar quais tickers estão disponíveis
        if (Array.isArray(dadosAgenda)) {
          const tickersDisponiveis = [...new Set(dadosAgenda.map((e: any) => e.ticker))];
          debug.tickersDisponiveis = tickersDisponiveis;
        }
        
        setDebugInfo(debug);
        setEventos([]);
        setLoading(false);
        return;
      }

      // 🔄 PROCESSAR E VALIDAR EVENTOS
      const eventosProcessados = eventosTicker.map((evento: any, index: number) => {
        try {
          // Converter data_evento para Date
          let dataEvento: Date;
          
          if (evento.data_evento) {
// Parser inteligente de datas - aceita múltiplos formatos
const parseDataInteligente = (dataString) => {
  if (!dataString) return null;
  
  // Remover espaços e normalizar separadores
  const data = dataString.trim().replace(/\//g, '-').replace(/\./g, '-');
  
  // Diferentes padrões de data
  const padroes = [
    // ISO: YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // Brasileiro: DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // Americano: MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // Seu formato: YYYY-DD-MM
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  ];
  
  const match = data.match(/^(\d{1,4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  
  const [, parte1, parte2, parte3] = match;
  let ano, mes, dia;
  
  // Detectar formato baseado nos valores
  if (parte1.length === 4) {
    // Começa com ano (4 dígitos)
    ano = parseInt(parte1);
    
    if (parseInt(parte2) > 12) {
      // YYYY-DD-MM (seu formato preferido)
      dia = parseInt(parte2);
      mes = parseInt(parte3);
    } else if (parseInt(parte3) > 12) {
      // YYYY-MM-DD (formato ISO)
      mes = parseInt(parte2);
      dia = parseInt(parte3);
    } else {
      // Ambos podem ser mês/dia, assumir YYYY-MM-DD como padrão
      mes = parseInt(parte2);
      dia = parseInt(parte3);
    }
  } else {
    // Não começa com ano
    ano = parseInt(parte3);
    
    if (parseInt(parte1) > 12) {
      // DD-MM-YYYY (formato brasileiro)
      dia = parseInt(parte1);
      mes = parseInt(parte2);
    } else {
      // MM-DD-YYYY (formato americano) ou DD-MM-YYYY
      // Assumir formato brasileiro como padrão para Brasil
      dia = parseInt(parte1);
      mes = parseInt(parte2);
    }
  }
  
  // Validar valores
  if (ano < 1900 || ano > 2100) return null;
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;
  
  // Criar data com horário fixo para evitar problemas de timezone
  return new Date(ano, mes - 1, dia, 12, 0, 0);
};

// Usar o parser inteligente
dataEvento = parseDataInteligente(evento.data_evento);
if (!dataEvento) {
  console.error(`Data inválida: ${evento.data_evento}`);
  return null;
}
          } else if (evento.data) {
            dataEvento = new Date(evento.data);
          } else {
            throw new Error('Campo data_evento não encontrado');
          }

          if (isNaN(dataEvento.getTime())) {
            throw new Error(`Data inválida: ${evento.data_evento || evento.data}`);
          }

          return {
            id: evento.id || `${ticker}-${index}`,
            ticker: evento.ticker,
            tipo: evento.tipo_evento || evento.tipo,
            titulo: evento.titulo,
            descricao: evento.descricao,
            data: evento.data_evento || evento.data,
            dataObj: dataEvento,
            status: evento.status,
            prioridade: evento.prioridade,
            categoria: evento.tipo_evento || evento.tipo,
            estimado: evento.status?.toLowerCase() === 'estimado',
            observacoes: evento.observacoes
          };
        } catch (error) {
          debug.erros.push(`Evento ${index}: ${error.message}`);
          return null;
        }
      }).filter(Boolean);

      // Ordenar eventos por data
      eventosProcessados.sort((a, b) => a.dataObj.getTime() - b.dataObj.getTime());

      debug.eventosValidos = eventosProcessados.map(e => ({
        id: e.id,
        titulo: e.titulo,
        data: e.dataObj.toISOString(),
        tipo: e.tipo
      }));

      setDebugInfo(debug);
      setEventos(eventosProcessados);
      
      console.log(`✅ [DEBUG] Eventos carregados da CENTRAL para ${ticker}:`, {
        total: eventosProcessados.length,
        eventos: debug.eventosValidos
      });

    } catch (error) {
      console.error(`❌ [DEBUG] Erro geral ao carregar eventos:`, error);
      setDebugInfo({
        ticker,
        erros: [`Erro geral: ${error.message}`]
      });
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [ticker, isFII]);

  // Carregar eventos ao montar o componente
  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  // 🎨 RENDER DO COMPONENTE
  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
  📅 Agenda Corporativa
</Typography>
        {/* ESTADO DE LOADING */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Carregando eventos...
            </Typography>
          </Box>
        ) : eventos.length === 0 ? (
          /* ESTADO SEM EVENTOS */
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📭 Nenhum evento encontrado para {ticker}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3 }}>
              {debugInfo?.erros?.length > 0 
                ? `❌ Problemas detectados: ${debugInfo.erros.length}`
                : `ℹ️ Não há eventos cadastrados para este ticker`
              }
            </Typography>
            
            {debugInfo?.tickersDisponiveis && (
              <Typography variant="body2" sx={{ mb: 3, color: 'info.main' }}>
                📊 Tickers disponíveis na central: {debugInfo.tickersDisponiveis.join(', ')}
              </Typography>
            )}
            
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/dashboard/central-agenda'}
              startIcon="🛠️"
              size="small"
            >
              Ir para Central da Agenda
            </Button>
          </Box>
        ) : (
          /* LISTA DE EVENTOS */
          <>
            <Stack spacing={2}>
              {eventos.slice(0, 4).map((evento, index) => {
                const diasAteEvento = calcularDiasAteEvento(evento.dataObj);
                const proximidade = formatarProximidade(diasAteEvento);
                
                return (
                  <Card key={evento.id} sx={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 2,
                    backgroundColor: 'white',
                    cursor: 'default'
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="center" spacing={3}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 600,
                                fontSize: '1rem',
                                mb: 0.5,
                                color: '#1e293b'
                              }}>
                                {evento.titulo}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                                mb: 1.5
                              }}>
                                {evento.descricao}
                              </Typography>

                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip 
                                  label={proximidade}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: diasAteEvento <= 7 ? '#f59e0b' : '#6b7280',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    height: 24
                                  }}
                                />
                                
                                <Chip 
                                  label={evento.tipo}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    borderColor: '#d1d5db',
                                    color: '#6b7280',
                                    height: 24
                                  }}
                                />
                              </Stack>
                            </Box>

                            <Box sx={{ 
                              textAlign: 'right',
                              minWidth: 120,
                              flexShrink: 0
                            }}>
                              <Typography variant="h5" sx={{ 
                                fontWeight: 700,
                                color: diasAteEvento <= 7 ? '#f59e0b' : '#3b82f6',
                                fontSize: '1.2rem',
                                lineHeight: 1
                              }}>
                                {evento.dataObj.getDate()}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: '#64748b',
                                fontSize: '0.85rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {evento.dataObj.toLocaleDateString('pt-BR', {
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ 
                                fontSize: '0.7rem',
                                display: 'block',
                                mt: 0.5
                              }}>
                                {evento.dataObj.toLocaleDateString('pt-BR', {
                                  weekday: 'long'
                                })}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>

            {eventos.length > 4 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Mostrando os próximos 4 eventos • Total: {eventos.length}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
const DadosPosicaoExpandidos = React.memo(({ 
  empresa, 
  dadosFinanceiros, 
  precoAtualFormatado,
  isFII = false 
}: { 
  empresa: EmpresaCompleta; 
  dadosFinanceiros?: DadosFinanceiros;
  precoAtualFormatado: string;
  isFII?: boolean;
}) => {
  const { dadosFII, loading: loadingFII, error: errorFII, refetch, salvarDadosManuais } = useDadosFII(empresa.ticker, dadosFinanceiros);
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState<Partial<DadosFII>>({});

  // Inicializar dados temporários quando entrar no modo edição
  useEffect(() => {
    if (editMode) {
      setTempData({
        dyCagr3Anos: dadosFII?.dyCagr3Anos,
        numeroCotistas: dadosFII?.numeroCotistas
      });
    }
  }, [editMode, dadosFII]);

  const handleSave = () => {
    salvarDadosManuais(tempData);
    setEditMode(false);
  };

  if (isFII) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Card Principal - Dados da Posição */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                📊 Dados da Posição
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Data de Entrada</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.dataEntrada}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Preço Inicial</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.precoIniciou}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: dadosFinanceiros?.precoAtual ? '#e8f5e8' : '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Preço Atual</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: dadosFinanceiros?.precoAtual ? '#22c55e' : 'inherit' }}>
                    {precoAtualFormatado}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">% da Carteira</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.percentualCarteira}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Gestora</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.gestora || 'N/A'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Card FII - Dados Fundamentalistas */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#fef7e0', position: 'relative' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#92400e' }}>
                  🏢 Dados Fundamentalistas
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {dadosFII?.fonte && (
                    <Chip 
                      label={dadosFII.fonte === 'api' ? 'API' : dadosFII.fonte === 'misto' ? 'API+Manual' : 'Manual'}
                      size="small"
                      color={dadosFII.fonte === 'api' ? 'success' : dadosFII.fonte === 'misto' ? 'warning' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                  <IconButton 
                    size="small" 
                    onClick={refetch} 
                    disabled={loadingFII}
                    title="Atualizar dados da API"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              </Stack>
              
              {loadingFII ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Carregando dados...
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#fefce8', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Val. Patrimonial p/Cota</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dadosFII?.valorPatrimonial ? formatarValor(dadosFII.valorPatrimonial) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#fefce8', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">P/VP</Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: dadosFII?.pvp ? (dadosFII.pvp < 1 ? '#22c55e' : dadosFII.pvp > 1.2 ? '#ef4444' : '#f59e0b') : 'inherit'
                    }}>
                      {dadosFII?.pvp ? dadosFII.pvp.toFixed(2) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#fefce8', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Patrimônio Líquido</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dadosFII?.patrimonio ? formatarValor(dadosFII.patrimonio, 'millions') : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#fefce8', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Valor de Mercado</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dadosFII?.valorMercado ? formatarValor(dadosFII.valorMercado, 'millions') : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#fefce8', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Valor em Caixa</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dadosFII?.valorCaixa ? formatarValor(dadosFII.valorCaixa, 'millions') : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              )}
              
              {errorFII && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    ⚠️ API indisponível. Usando dados manuais.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Card Adicional - Dados Operacionais e Edição */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#f0f9ff' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
                  📈 Dados Operacionais
                </Typography>
                <Button
                  variant={editMode ? "contained" : "outlined"}
                  size="small"
                  onClick={() => editMode ? handleSave() : setEditMode(true)}
                  color={editMode ? "success" : "primary"}
                  startIcon={editMode ? <CheckIcon /> : undefined}
                >
                  {editMode ? 'Salvar' : 'Editar'}
                </Button>
              </Stack>
              
              <Grid container spacing={3}>
                <Grid item xs={6} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                      {dadosFII?.numeroCotas ? (dadosFII.numeroCotas / 1000000).toFixed(1) + 'M' : 'N/A'}
                    </Typography>
                    <Typography variant="caption">Nº de Cotas</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                      {dadosFII?.ultimoRendimento ? formatarValor(dadosFII.ultimoRendimento).replace('R$ ', '') : 'N/A'}
                    </Typography>
                    <Typography variant="caption">Último Rendimento</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    {editMode ? (
                      <TextField
                        size="small"
                        type="number"
                        value={tempData.dyCagr3Anos || ''}
                        onChange={(e) => setTempData(prev => ({ ...prev, dyCagr3Anos: parseFloat(e.target.value) || undefined }))}
                        inputProps={{ step: 0.1, min: 0, max: 100 }}
                        sx={{ width: '80px' }}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                        {dadosFII?.dyCagr3Anos ? `${dadosFII.dyCagr3Anos.toFixed(1)}%` : 'N/A'}
                      </Typography>
                    )}
                    <Typography variant="caption">DY CAGR (3a)</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    {editMode ? (
                      <TextField
                        size="small"
                        type="number"
                        value={tempData.numeroCotistas || ''}
                        onChange={(e) => setTempData(prev => ({ ...prev, numeroCotistas: parseInt(e.target.value) || undefined }))}
                        inputProps={{ step: 1, min: 0 }}
                        sx={{ width: '100px' }}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                        {dadosFII?.numeroCotistas ? dadosFII.numeroCotistas.toLocaleString('pt-BR') : 'N/A'}
                      </Typography>
                    )}
                    <Typography variant="caption">Nº de Cotistas</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                      {dadosFII?.dataUltimoRendimento ? 
                        new Date(dadosFII.dataUltimoRendimento).toLocaleDateString('pt-BR').replace(/\/\d{4}/, '') : 'N/A'}
                    </Typography>
                    <Typography variant="caption">Último Pagto</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {editMode && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#fef3c7', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    ✏️ Editando dados manuais. DY CAGR e número de cotistas não estão disponíveis via API.
                  </Typography>
                </Box>
              )}
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>💡 Sobre os dados:</strong><br/>
                  • 🟢 <strong>Dados da API:</strong> Val. patrimonial, P/VP, patrimônio, valor de mercado, caixa, cotas<br/>
                  • 🟡 <strong>Dados manuais:</strong> DY CAGR (3 anos) e número de cotistas<br/>
                  • 🔄 <strong>Atualização:</strong> {dadosFII?.ultimaAtualizacao || 'Não disponível'}
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // Versão original para ações (mantida sem alterações)
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              📊 Dados da Posição
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Data de Entrada</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.dataEntrada}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Preço Inicial</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.precoIniciou}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: dadosFinanceiros?.precoAtual ? '#e8f5e8' : '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Preço Atual</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dadosFinanceiros?.precoAtual ? '#22c55e' : 'inherit' }}>
                  {precoAtualFormatado}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Análise de Viés - versão original para ações */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              🎯 Análise de Viés
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Preço Teto</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.precoTeto}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Viés Atual</Typography>
                <Chip 
                  label={empresa.viesAtual}
                  size="small"
color={
  empresa.viesAtual === 'Compra' ? 'success' : 'warning'
}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">% da Carteira</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{empresa.percentualCarteira}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
});
const MobileDebugPanel = () => {
  const [showDebug, setShowDebug] = useState(false);
  
  const forcarDados = () => {
    logMobile(`🔄 Forçando recarregamento de dados`);
    // Limpar cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_') || key.startsWith('dados_fii_')) {
        localStorage.removeItem(key);
        logMobile(`🗑️ Cache removido: ${key}`);
      }
    });
    // Recarregar página
    setTimeout(() => window.location.reload(), 1000);
  };
  
  if (!isMobile()) return null;
  
  return (
    <>
      {/* Botão flutuante para mostrar debug */}
      <Box sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999
      }}>
        <IconButton
          onClick={() => setShowDebug(!showDebug)}
          sx={{
            backgroundColor: showDebug ? '#22c55e' : '#ef4444',
            color: 'white',
            '&:hover': { backgroundColor: showDebug ? '#16a34a' : '#dc2626' },
            width: 56,
            height: 56
          }}
        >
          {showDebug ? '✅' : '🐛'}
        </IconButton>
      </Box>
      
      {/* Panel de debug */}
      {showDebug && (
        <Box sx={{
          position: 'fixed',
          top: 10,
          left: 10,
          right: 10,
          backgroundColor: 'rgba(0,0,0,0.95)',
          color: 'white',
          p: 2,
          borderRadius: 1,
          zIndex: 9998,
          maxHeight: '70vh',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            📱 Debug Mobile - MALL11
          </Typography>
          
          <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
            • User Agent: {navigator.userAgent.substring(0, 30)}...<br/>
            • Screen: {window.screen.width}x{window.screen.height}<br/>
            • Viewport: {window.innerWidth}x{window.innerHeight}<br/>
            • Online: {navigator.onLine ? '✅' : '❌'}<br/>
            • Connection: {(navigator as any).connection?.effectiveType || 'unknown'}<br/>
            • LocalStorage: {typeof Storage !== 'undefined' ? '✅' : '❌'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button 
              size="small" 
              onClick={forcarDados}
              sx={{ 
                backgroundColor: '#f59e0b', 
                color: 'white',
                '&:hover': { backgroundColor: '#d97706' }
              }}
            >
              🔄 Forçar Dados
            </Button>
            
            <Button 
              size="small" 
              onClick={() => {
                localStorage.clear();
                logMobile(`🗑️ LocalStorage limpo`);
              }}
              sx={{ 
                backgroundColor: '#dc2626', 
                color: 'white',
                '&:hover': { backgroundColor: '#b91c1c' }
              }}
            >
              🗑️ Limpar Cache
            </Button>
          </Box>
          
          <Button 
            size="small" 
            onClick={() => setShowDebug(false)}
            sx={{ color: 'white', border: '1px solid white' }}
          >
            Fechar Debug
          </Button>
        </Box>
      )}
    </>
  );
};
// ========================================
// COMPONENTE PRINCIPAL - DETALHES DA EMPRESA
// ========================================
export default function EmpresaDetalhes() {
  const params = useParams();
  const ticker = (params?.ticker as string) || '';
  
  const [empresa, setEmpresa] = useState<EmpresaCompleta | null>(null);
  const [dataSource, setDataSource] = useState<'admin' | 'fallback' | 'not_found'>('not_found');
  
  const { dadosFinanceiros, loading: dadosLoading, error: dadosError, ultimaAtualizacao, refetch } = useDadosFinanceiros(ticker);
  const isFII = empresa?.tipo === 'FII';

  // 🆕 NOVO: Hook para calcular DY
  const { dy12Meses, dyDesdeEntrada } = useDividendYield(
  ticker, 
  empresa?.dataEntrada || '', 
  dadosFinanceiros?.precoAtual, 
  empresa?.precoIniciou || '',
  isFII
);

  useEffect(() => {
    if (!ticker) return;

    const carregarDados = () => {
      try {
        if (typeof window !== 'undefined') {
          const dadosAdmin = localStorage.getItem('portfolioDataAdmin');

          if (dadosAdmin) {
            const ativos = JSON.parse(dadosAdmin);
            const ativoEncontrado = ativos.find((a: any) => a.ticker === ticker);

            if (ativoEncontrado) {
              const ativoNormalizado: EmpresaCompleta = {
                ...ativoEncontrado,
                viesOverride: normalizeViesOverride(ativoEncontrado.viesOverride)
              };

              setEmpresa(ativoNormalizado);
              setDataSource('admin');
              return;
            }
          }
        }

        const ativoFallback = dadosFallback[ticker];
        if (ativoFallback) {
          const ativoNormalizado: EmpresaCompleta = {
            ...ativoFallback,
            viesOverride: normalizeViesOverride(ativoFallback.viesOverride)
          };

          setEmpresa(ativoNormalizado);
          setDataSource('fallback');
          return;
        }

        setDataSource('not_found');
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setDataSource('not_found');
      }
    };

    carregarDados();
  }, [ticker]);

  const empresaCompleta = React.useMemo(() => {
    if (!empresa) return null;

    const overrideNormalizado = normalizeViesOverride(empresa.viesOverride);

    if (dadosFinanceiros && dadosFinanceiros.precoAtual > 0) {
      return {
        ...empresa,
        dadosFinanceiros,
        viesOverride: overrideNormalizado,
        viesAtual: calcularViesSimplificado(
          empresa.precoTeto,
          dadosFinanceiros.precoAtual,
          overrideNormalizado
        ),
        statusApi: 'success',
        ultimaAtualizacao
      };
    }

    const viesComOverride = aplicarViesOverride(
      overrideNormalizado,
      empresa.viesAtual || 'Aguardar'
    );

    return {
      ...empresa,
      viesOverride: overrideNormalizado,
      viesAtual: viesComOverride,
      statusApi: empresa.statusApi ?? 'error'
    };
  }, [empresa, dadosFinanceiros, ultimaAtualizacao]);
  // Identificar se é FII

  const calcularPerformance = useCallback(() => {
    if (!empresaCompleta || !empresaCompleta.dadosFinanceiros) return 'N/A';
    
    try {
      const precoEntradaStr = empresaCompleta.precoIniciou.replace('R$ ', '').replace('.', '').replace(',', '.');
      const precoEntrada = parseFloat(precoEntradaStr);
      const precoAtual = empresaCompleta.dadosFinanceiros.precoAtual;
      
      if (precoEntrada > 0 && precoAtual > 0) {
        const performance = ((precoAtual - precoEntrada) / precoEntrada) * 100;
        return formatarValor(performance, 'percent');
      }
    } catch (error) {
      console.error('Erro ao calcular performance:', error);
    }
    
    return 'N/A';
  }, [empresaCompleta]);

  if (!empresaCompleta || dataSource === 'not_found') {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          🔍 Empresa não encontrada
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, mb: 4, maxWidth: 400, mx: 'auto' }}>
          O ticker "<strong>{ticker}</strong>" não foi encontrado na nossa base de dados.
        </Typography>
        <Button 
          startIcon={<ArrowLeftIcon />} 
          onClick={() => window.history.back()}
          variant="contained"
          size="large"
        >
          Voltar à Lista
        </Button>
      </Box>
    );
  }

  const dados = empresaCompleta.dadosFinanceiros;
  const precoAtualFormatado = dados?.precoAtual ? formatarValor(dados.precoAtual) : empresaCompleta.precoIniciou;
  const tendencia = dados?.variacaoPercent ? (dados.variacaoPercent >= 0 ? 'up' : 'down') : undefined;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowLeftIcon />} 
          onClick={() => window.history.back()} 
          variant="outlined"
        >
          Voltar
        </Button>
        
        <Stack direction="row" spacing={2} alignItems="center">
          {dadosLoading ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Carregando...
            </Alert>
          ) : dadosError ? (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Erro na API
            </Alert>
          ) : dados && dados.precoAtual > 0 ? (
            <Alert severity="success" sx={{ py: 0.5 }}>
              Dados da API BRAPI
            </Alert>
          ) : (
            <Alert severity="info" sx={{ py: 0.5 }}>
              Dados estáticos
            </Alert>
          )}
          
          <IconButton onClick={refetch} disabled={dadosLoading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Card principal da empresa */}
      <Card sx={{ 
  mb: 4, 
  background: isFII 
    ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' 
    : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' 
}}>
        <CardContent sx={{ p: 4 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3} 
            alignItems={{ xs: 'center', md: 'flex-start' }}
          >
            <Avatar 
              src={empresaCompleta.avatar} 
              alt={empresaCompleta.ticker} 
              sx={{ 
                width: { xs: 100, md: 120 }, 
                height: { xs: 100, md: 120 },
                backgroundColor: '#ffffff',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#374151'
              }}
            >
              {empresaCompleta.ticker.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center" 
                justifyContent={{ xs: 'center', md: 'flex-start' }} 
                sx={{ mb: 1 }}
              >
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {empresaCompleta.ticker}
                </Typography>
                {empresaCompleta.tipo === 'FII' && (
                  <Chip label="FII" color="primary" />
                )}
              </Stack>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {empresaCompleta.nomeCompleto}
              </Typography>
              <Chip 
                label={empresaCompleta.setor} 
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="body1" sx={{ maxWidth: 600 }}>
                {empresaCompleta.descricao}
              </Typography>
              {isFII && empresaCompleta.gestora && (
  <Typography variant="body2" sx={{ 
    mt: 2, 
    color: '#92400e',
    fontWeight: 500 
  }}>
    🏢 Gestora: {empresaCompleta.gestora}
  </Typography>
)}
            </Box>
            <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              {dadosLoading ? (
                <Skeleton variant="text" width={150} height={60} />
              ) : (
                <>
                  <Typography variant="h2" sx={{ fontWeight: 700 }}>
                    {precoAtualFormatado}
                  </Typography>
{tendencia && (
  <Typography sx={{ 
    color: tendencia === 'up' ? '#22c55e' : '#ef4444', 
    fontWeight: 700, 
    fontSize: '1.2rem'
  }}>
    {dados?.variacaoPercent ? formatarValor(dados.variacaoPercent, 'percent') : 'N/A'}
  </Typography>
)}
                </>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 🆕 MODIFICADO: Cards de métricas com DY - AGORA 6 CARDS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="COTAÇÃO" 
            value={precoAtualFormatado}
            loading={dadosLoading}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="VARIAÇÃO HOJE" 
            value={dados?.variacaoPercent ? formatarValor(dados.variacaoPercent, 'percent') : 'N/A'}
            loading={dadosLoading}
            trend={dados?.variacaoPercent ? (dados.variacaoPercent >= 0 ? 'up' : 'down') : undefined}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="PERFORMANCE" 
            value={calcularPerformance()}
            subtitle="desde entrada"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="P/L" 
            value={dados?.pl ? formatarValor(dados.pl, 'number') : 'N/A'}
            loading={dadosLoading}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="DY 12 MESES" 
            value={dy12Meses > 0 ? `${dy12Meses.toFixed(2)}%` : 'N/A'}
            subtitle="últimos 12m"
            loading={dadosLoading}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="DY ENTRADA" 
            value={dyDesdeEntrada > 0 ? `${dyDesdeEntrada.toFixed(2)}%` : 'N/A'}
            subtitle="desde entrada"
            loading={dadosLoading}
          />
        </Grid>
      </Grid>

      {/* Histórico de Dividendos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <HistoricoDividendos ticker={ticker} dataEntrada={empresaCompleta.dataEntrada} isFII={isFII} />
        </Grid>
      </Grid>

      {/* Seções secundárias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <GerenciadorRelatorios ticker={ticker} />
        </Grid>
        
        <Grid item xs={12}>
          <AgendaCorporativa ticker={ticker} isFII={isFII} />
        </Grid>
      </Grid>

      {/* Dados da Posição */}
      {/* Dados da Posição Expandidos */}
      <DadosPosicaoExpandidos 
        empresa={empresaCompleta} 
        dadosFinanceiros={dados}
        precoAtualFormatado={precoAtualFormatado}
        isFII={isFII}
      />
      {/* Debug Mobile Panel */}
      <MobileDebugPanel />
    </Box>
  );
}
