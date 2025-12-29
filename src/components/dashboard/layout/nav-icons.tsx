// src/components/dashboard/layout/nav-icons.ts
import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPie } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { ChartLineUp } from '@phosphor-icons/react/dist/ssr/ChartLineUp';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
import { Globe } from '@phosphor-icons/react/dist/ssr/Globe';
import { Package } from '@phosphor-icons/react/dist/ssr/Package';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
// Novos ícones melhorados
import { Book } from '@phosphor-icons/react/dist/ssr/Book';
import { Receipt } from '@phosphor-icons/react/dist/ssr/Receipt';
import { VideoCamera } from '@phosphor-icons/react/dist/ssr/VideoCamera';
import { Airplane } from '@phosphor-icons/react/dist/ssr/Airplane';
import { Table } from '@phosphor-icons/react/dist/ssr/Table';
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { Lightbulb } from '@phosphor-icons/react/dist/ssr/Lightbulb';
import { ChartLine } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { Star } from '@phosphor-icons/react/dist/ssr/Star';
import { Shield } from '@phosphor-icons/react/dist/ssr/Shield';
import { Briefcase } from '@phosphor-icons/react/dist/ssr/Briefcase';
// 🛡️ NOVOS ÍCONES ADMINISTRATIVOS
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Link } from '@phosphor-icons/react/dist/ssr/Link';
import { List } from '@phosphor-icons/react/dist/ssr/List';
// 📱 ÍCONE PARA INSTAGRAM CLOSE FRIENDS
import { InstagramLogo } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
// 📋 ÍCONES PARA DOCUMENTOS E RELATÓRIOS
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { Newspaper } from '@phosphor-icons/react/dist/ssr/Newspaper';
import { Article } from '@phosphor-icons/react/dist/ssr/Article';
// 🆕 ÍCONE PARA SUPORTE
import { Headset } from '@phosphor-icons/react/dist/ssr/Headset';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';

export const navIcons = {
  'chart-pie': ChartPie,
  'chart-bar': ChartBar,
  'chart-line-up': ChartLineUp,
  'chart-line': ChartLine,        // ← JÁ EXISTE, USADO PARA RENTABILIDADES
  'buildings': Buildings,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  'user': UserIcon,
  'users': UsersIcon,
  'globe': Globe,
  'package': Package,
  'briefcase': Briefcase,
  
  // Ícones dos recursos exclusivos
  'lightbulb': Lightbulb,         // Para Dicas de Investimentos
  'book': Book,                   // Para eBooks
  'receipt': Receipt,             // Para Imposto de Renda
  'video': VideoCamera,           // Para Lives e Aulas
  'airplane': Airplane,           // Para Milhas Aéreas
  'table': Table,                 // Para Planilhas
  'chat': ChatCircle,             // Para Telegram
  'star': Star,                   // Para Projeto América
  'shield': Shield,               // Para Reserva de Emergência
  'support': Headset,             // Para Suporte/Central de Dúvidas
  
  // 🛡️ ÍCONES ADMINISTRATIVOS
  'gear': Gear,                   // Para menu Administração e configurações
  'shield-check': ShieldCheck,    // Para Super Admin
  'link': Link,                   // Para Integrações
  'list': List,                   // Para Analisar Carteiras
  'calendar': Calendar,
  
  // 📱 INSTAGRAM CLOSE FRIENDS
  'instagram': InstagramLogo,     // Para Instagram Close Friends Admin
  
  // 📋 ÍCONES PARA DOCUMENTOS E RELATÓRIOS
  'document-text': FileText,      // Para Relatório Semanal Admin
  'file-text': FileText,          // Alternativa
  'clipboard-document': ClipboardText, // Para documentos de clipboard
  'clipboard-text': ClipboardText, // Alternativa
  'newspaper': Newspaper,         // Para notícias/relatórios
  'article': Article,             // Para artigos
  'arrows-clockwise': ArrowsClockwise,
} as Record<string, Icon>;