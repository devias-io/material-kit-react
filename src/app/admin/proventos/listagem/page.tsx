'use client';

import { useMemo, useState } from 'react';
import { useProventos } from '@/hooks/useProventos';

const tipoOptions = [
  { label: 'Todos', value: '' },
  { label: 'Dividendo', value: 'DIVIDENDO' },
  { label: 'JCP', value: 'JCP' },
];

const origemOptions = [
  { label: 'Todos', value: '' },
  { label: 'BRAPI', value: 'BRAPI' },
  { label: 'CSV', value: 'CSV' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

export default function ListagemProventosPage() {
  const {
    proventos,
    pagination,
    order,
    loading,
    error,
    estatisticas,
    loadingStats,
    applyFilters,
    clearFilters,
    goToPage,
    toggleOrder,
    range,
  } = useProventos();

  const [tickerInput, setTickerInput] = useState('');
  const [tipoInput, setTipoInput] = useState('');
  const [origemInput, setOrigemInput] = useState('');

  const filtersActive = useMemo(
    () => Boolean(tickerInput || tipoInput || origemInput),
    [origemInput, tickerInput, tipoInput]
  );

  const handleApplyFilters = () => {
    applyFilters({
      ticker: tickerInput.trim().toUpperCase() || undefined,
      tipo: (tipoInput as typeof tipoOptions[number]['value']) || undefined,
      origem: (origemInput as typeof origemOptions[number]['value']) || undefined,
    });
  };

  const handleClearFilters = () => {
    setTickerInput('');
    setTipoInput('');
    setOrigemInput('');
    clearFilters();
  };

  const statsCards = useMemo(() => {
    if (!estatisticas) return [];
    return [
      {
        title: 'Total de Proventos',
        value: estatisticas.totalProventos.toLocaleString('pt-BR'),
      },
      {
        title: 'Tickers Únicos',
        value: estatisticas.totalEmpresas.toLocaleString('pt-BR'),
      },
      {
        title: 'Soma de Valores',
        value: formatCurrency(estatisticas.valorTotal),
      },
      {
        title: 'Último Upload',
        value: estatisticas.dataUltimoUpload
          ? formatDate(estatisticas.dataUltimoUpload)
          : '—',
      },
    ];
  }, [estatisticas]);

  const badgeTipoClasses: Record<string, string> = {
    DIVIDENDO: 'bg-blue-100 text-blue-700 border-blue-200',
    JCP: 'bg-green-100 text-green-700 border-green-200',
  };

  const badgeOrigemClasses: Record<string, string> = {
    BRAPI: 'bg-purple-100 text-purple-700 border-purple-200',
    CSV: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pb-12">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Admin · Proventos
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              Listagem de Proventos
            </h1>
            <p className="mt-1 text-base text-slate-600">
              Consulte proventos, filtre por ticker, tipo ou origem e navegue pelos últimos lançamentos.
            </p>
          </div>
          <div className="hidden rounded-full bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600 shadow sm:block">
            Ordenação: {order === 'desc' ? 'Mais recentes' : 'Mais antigos'}
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl bg-white/80 p-4 shadow-lg ring-1 ring-slate-200 sm:grid-cols-4">
          <div className="sm:col-span-4 grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Ticker</label>
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="VALE3"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Tipo</label>
              <select
                value={tipoInput}
                onChange={(e) => setTipoInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Origem</label>
              <select
                value={origemInput}
                onChange={(e) => setOrigemInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {origemOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={handleApplyFilters}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-auto"
              disabled={loading}
            >
              Filtrar
            </button>
            <button
              onClick={handleClearFilters}
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-auto"
              disabled={loading || !filtersActive}
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(loadingStats || !estatisticas) && (
            <div className="col-span-full text-sm text-slate-500">Carregando estatísticas...</div>
          )}
          {statsCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white/90 p-4 shadow-lg ring-1 ring-slate-200"
            >
              <p className="text-sm font-semibold text-slate-600">{card.title}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white/90 p-4 shadow-lg ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Resultados</h2>
              <p className="text-sm text-slate-500">
                Mostrando {range.start || 0}-{range.end || 0} de {pagination.total.toLocaleString('pt-BR')}
              </p>
            </div>
            <button
              onClick={toggleOrder}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Ordenar por data {order === 'desc' ? '▼' : '▲'}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Valor
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 cursor-pointer"
                    onClick={toggleOrder}
                  >
                    Data COM {order === 'desc' ? '▼' : '▲'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Data Pagamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Origem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                      Carregando proventos...
                    </td>
                  </tr>
                ) : proventos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                      Nenhum provento encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  proventos.map((provento) => (
                    <tr key={provento.id}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {provento.ticker}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                            badgeTipoClasses[provento.tipo as string] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {provento.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {formatCurrency(provento.valor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(provento.dataCom || provento.dataObj)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(provento.dataPagamento)}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                            badgeOrigemClasses[provento.origem || ''] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {provento.origem || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {provento.observacoes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-slate-600">
              Mostrando {range.start || 0}-{range.end || 0} de {pagination.total.toLocaleString('pt-BR')}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(Math.max(pagination.page - 1, 1))}
                disabled={pagination.page <= 1 || loading}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm font-semibold text-slate-700">
                Página {pagination.page} de {Math.max(pagination.totalPages, 1)}
              </span>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
