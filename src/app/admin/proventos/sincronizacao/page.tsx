'use client';

import { useState } from 'react';
import {
  useSincronizarProventos,
  useStatusSincronizacao,
  useHistoricoSincronizacao
} from '@/hooks/useProventosSync';

export default function SincronizacaoProventosPage() {
  const [syncId, setSyncId] = useState<number | null>(null);
  const [tickersCustom, setTickersCustom] = useState('');
  const [forcarAtualizacao, setForcarAtualizacao] = useState(false);

  // Hooks
  const { sincronizar, loading: sincronizando, error: erroSincronizar } = useSincronizarProventos();
  const { data: status, isEmProgresso } = useStatusSincronizacao(syncId);
  const { historico, loading: loadingHistorico, estatisticas, refetch } = useHistoricoSincronizacao({ limit: 10 });

  // Handler: Sincronizar todos os tickers
  const handleSincronizarTudo = async () => {
    try {
      const resultado = await sincronizar({ forcarAtualizacao });
      if (resultado?.syncId) {
        setSyncId(resultado.syncId);
      }
      alert('Sincronização iniciada! Acompanhe o progresso abaixo.');
      refetch(); // Atualizar histórico
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Sincronizar tickers específicos
  const handleSincronizarCustom = async () => {
    if (!tickersCustom.trim()) {
      alert('Digite pelo menos um ticker');
      return;
    }

    const tickers = tickersCustom
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    if (tickers.length === 0) {
      alert('Nenhum ticker válido encontrado');
      return;
    }

    try {
      const resultado = await sincronizar({ tickers, forcarAtualizacao });
      if (resultado?.syncId) {
        setSyncId(resultado.syncId);
      }
      alert(`Sincronização iniciada para: ${tickers.join(', ')}`);
      setTickersCustom('');
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Função para badge de status
  const getStatusBadge = (status: string) => {
    const colors = {
      EM_PROGRESSO: 'bg-blue-500',
      CONCLUIDO: 'bg-green-500',
      ERRO: 'bg-red-500'
    } as const;
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sincronização de Proventos</h1>
          <p className="text-gray-600 mt-1">
            Sincronize proventos da API BRAPI automaticamente
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Sincronizações</p>
            <p className="text-2xl font-bold">{estatisticas.totalSincronizacoes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Proventos Novos</p>
            <p className="text-2xl font-bold text-green-600">
              {estatisticas.totalProventosNovos.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Proventos Atualizados</p>
            <p className="text-2xl font-bold text-blue-600">
              {estatisticas.totalProventosAtualizados.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Erros</p>
            <p className="text-2xl font-bold text-red-600">
              {estatisticas.totalErros}
            </p>
          </div>
        </div>
      )}

      {/* Card de Sincronização Rápida */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Sincronizar Agora</h2>

        <div className="space-y-4">
          {/* Botão Sincronizar Tudo */}
          <div>
            <button
              onClick={handleSincronizarTudo}
              disabled={sincronizando || isEmProgresso}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {sincronizando ? 'Iniciando...' : 'Sincronizar Todos os Tickers'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Sincroniza proventos de todos os tickers do banco de dados
            </p>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Sincronização Customizada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sincronizar Tickers Específicos
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tickersCustom}
                onChange={(e) => setTickersCustom(e.target.value)}
                placeholder="PETR4, VALE3, ITUB4..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sincronizando || isEmProgresso}
              />
              <button
                onClick={handleSincronizarCustom}
                disabled={sincronizando || isEmProgresso || !tickersCustom.trim()}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Sincronizar
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Separe os tickers por vírgula
            </p>
          </div>

          {/* Checkbox: Forçar Atualização */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="forcarAtualizacao"
              checked={forcarAtualizacao}
              onChange={(e) => setForcarAtualizacao(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={sincronizando || isEmProgresso}
            />
            <label htmlFor="forcarAtualizacao" className="ml-2 text-sm text-gray-700">
              Forçar atualização (sobrescrever dados CSV)
            </label>
          </div>

          {/* Erro */}
          {erroSincronizar && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{erroSincronizar}</p>
            </div>
          )}
        </div>
      </div>

      {/* Card de Progresso (se houver sincronização ativa) */}
      {status && isEmProgresso && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sincronização em Andamento</h2>

          <div className="space-y-4">
            {/* Barra de Progresso */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span>{status.porcentagem}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${status.porcentagem}%` }}
                />
              </div>
            </div>

            {/* Detalhes */}
            {status.progresso !== undefined && status.total !== undefined && (
              <p className="text-sm text-gray-600">
                Processando: <strong>{status.progresso}</strong> de <strong>{status.total}</strong> tickers
              </p>
            )}

            {status.tickerAtual && (
              <p className="text-sm text-gray-600">
                Ticker atual: <strong className="text-blue-600">{status.tickerAtual}</strong>
              </p>
            )}

            {/* Métricas em tempo real */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Novos</p>
                <p className="text-lg font-semibold text-green-600">
                  {status.metricas?.totalNovos || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Atualizados</p>
                <p className="text-lg font-semibold text-blue-600">
                  {status.metricas?.totalAtualizados || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Erros</p>
                <p className="text-lg font-semibold text-red-600">
                  {status.metricas?.totalErros || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Sincronizações */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Histórico de Sincronizações</h2>
          <button
            onClick={refetch}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Atualizar
          </button>
        </div>

        {loadingHistorico ? (
          <p className="text-gray-500">Carregando histórico...</p>
        ) : historico.length === 0 ? (
          <p className="text-gray-500">Nenhuma sincronização encontrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Ticker(s)</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4">Duração</th>
                  <th className="pb-3 pr-4">Novos</th>
                  <th className="pb-3 pr-4">Atualizados</th>
                  <th className="pb-3 pr-4">Erros</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((sync) => (
                  <tr key={sync.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4">#{sync.id}</td>
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium">
                        {sync.ticker.length > 30
                          ? sync.ticker.substring(0, 30) + '...'
                          : sync.ticker}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded ${getStatusBadge(sync.status)}`}>
                        {sync.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {new Date(sync.dataInicio).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {sync.duracao || '-'}
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold text-green-600">
                      {sync.metricas.totalNovos}
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold text-blue-600">
                      {sync.metricas.totalAtualizados}
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold text-red-600">
                      {sync.metricas.totalErros}
                    </td>
                    <td className="py-3">
                      {sync.temErros && (
                        <button
                          onClick={() => {
                            alert(JSON.stringify(sync.erros, null, 2));
                          }}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Ver erros
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
