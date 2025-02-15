import { useState, useMemo } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CSVLink } from 'react-csv'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

const CustomAnalysis = () => {
  const { products, categories, stockMovements, units, suppliers } = useRealtime()
  
  // getGroupKey fonksiyonunu en başta tanımlayalım
  const getGroupKey = (item, groupBy) => {
    switch (groupBy) {
      case 'category':
        const category = categories.find(c => c.id === item.category_id)
        return category?.name || 'Kategorisiz'
      case 'supplier':
        const supplier = suppliers.find(s => s.id === item.supplier_id)
        return supplier?.name || 'Tedarikçisiz'
      case 'date':
        return format(new Date(item.created_at), 'dd/MM/yyyy')
      case 'type':
        return item.type || 'Belirsiz'
      case 'product':
        const product = products.find(p => p.id === item.product_id)
        return product?.name || 'Ürün Bulunamadı'
      default:
        return 'Gruplanmamış'
    }
  }

  // Analiz parametreleri
  const [analysisParams, setAnalysisParams] = useState({
    dataSource: 'products', // products, stockMovements, categories
    metrics: [], // seçilen metrikler
    groupBy: '', // gruplama kriteri
    timeRange: {
      start: null,
      end: null
    },
    filters: [], // filtreler
    visualization: 'bar' // bar, line, pie, area
  })

  // Kullanılabilir veri kaynakları
  const dataSources = [
    { id: 'products', name: 'Ürünler' },
    { id: 'stockMovements', name: 'Stok Hareketleri' },
    { id: 'categories', name: 'Kategoriler' }
  ]

  // Veri kaynağına göre kullanılabilir metrikler
  const availableMetrics = {
    products: [
      { id: 'stock_total', name: 'Toplam Stok', calc: (p) => (Number(p.stock_warehouse) || 0) + (Number(p.stock_shelf) || 0) },
      { id: 'stock_value', name: 'Stok Değeri', calc: (p) => ((Number(p.stock_warehouse) || 0) + (Number(p.stock_shelf) || 0)) * (Number(p.price_buying) || 0) },
      { id: 'potential_revenue', name: 'Potansiyel Gelir', calc: (p) => ((Number(p.stock_warehouse) || 0) + (Number(p.stock_shelf) || 0)) * (Number(p.price_selling) || 0) },
      { id: 'profit_margin', name: 'Kar Marjı', calc: (p) => ((Number(p.price_selling) || 0) - (Number(p.price_buying) || 0)) / (Number(p.price_buying) || 1) * 100 }
    ],
    stockMovements: [
      { id: 'movement_count', name: 'Hareket Sayısı', calc: (movements) => movements.length },
      { id: 'total_quantity', name: 'Toplam Miktar', calc: (movements) => movements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0) },
      { id: 'total_value', name: 'Toplam Değer', calc: (movements) => movements.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0) },
      { id: 'average_value', name: 'Ortalama Değer', calc: (movements) => movements.length > 0 ? movements.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0) / movements.length : 0 }
    ],
    categories: [
      { id: 'product_count', name: 'Ürün Sayısı', calc: (products) => products.length },
      { id: 'total_stock', name: 'Toplam Stok', calc: (products) => products.reduce((sum, p) => sum + (Number(p.stock_warehouse) || 0) + (Number(p.stock_shelf) || 0), 0) },
      { id: 'category_value', name: 'Kategori Değeri', calc: (products) => products.reduce((sum, p) => sum + ((Number(p.stock_warehouse) || 0) + (Number(p.stock_shelf) || 0)) * (Number(p.price_buying) || 0), 0) }
    ]
  }

  // Gruplama seçenekleri
  const groupingOptions = {
    products: [
      { id: 'category', name: 'Kategori' },
      { id: 'supplier', name: 'Tedarikçi' }
    ],
    stockMovements: [
      { id: 'date', name: 'Tarih' },
      { id: 'type', name: 'Hareket Tipi' },
      { id: 'product', name: 'Ürün' }
    ],
    categories: [
      { id: 'none', name: 'Gruplanmamış' }
    ]
  }

  // Filtre seçenekleri
  const filterOptions = {
    products: [
      { id: 'category', name: 'Kategori', type: 'select', options: categories },
      { id: 'supplier', name: 'Tedarikçi', type: 'select', options: suppliers },
      { id: 'min_stock', name: 'Minimum Stok', type: 'number' },
      { id: 'max_stock', name: 'Maksimum Stok', type: 'number' }
    ],
    stockMovements: [
      { id: 'date_range', name: 'Tarih Aralığı', type: 'daterange' },
      { id: 'movement_type', name: 'Hareket Tipi', type: 'select', options: [
        { id: 'IN', name: 'Giriş' },
        { id: 'OUT', name: 'Çıkış' },
        { id: 'RETURN', name: 'İade' }
      ]},
      { id: 'min_value', name: 'Minimum Değer', type: 'number' },
      { id: 'max_value', name: 'Maksimum Değer', type: 'number' }
    ]
  }

  // Görselleştirme seçenekleri
  const visualizationOptions = [
    { id: 'bar', name: 'Çubuk Grafik' },
    { id: 'line', name: 'Çizgi Grafik' },
    { id: 'pie', name: 'Pasta Grafik' },
    { id: 'area', name: 'Alan Grafik' }
  ]

  // Analiz verilerini hesapla
  const analysisData = useMemo(() => {
    if (!analysisParams.dataSource || analysisParams.metrics.length === 0) return []

    let baseData = []
    switch (analysisParams.dataSource) {
      case 'products':
        baseData = products
        break
      case 'stockMovements':
        baseData = stockMovements
        break
      case 'categories':
        baseData = categories
        break
      default:
        return []
    }

    // Filtreleri uygula
    let filteredData = baseData.filter(item => {
      return analysisParams.filters.every(filter => {
        switch (filter.type) {
          case 'select':
            return !filter.value || item[filter.id] === filter.value
          case 'number':
            if (filter.id.startsWith('min_')) {
              return !filter.value || Number(item[filter.id.replace('min_', '')]) >= Number(filter.value)
            }
            if (filter.id.startsWith('max_')) {
              return !filter.value || Number(item[filter.id.replace('max_', '')]) <= Number(filter.value)
            }
            return true
          case 'daterange':
            if (!filter.value?.start || !filter.value?.end) return true
            const itemDate = parseISO(item.created_at)
            return isWithinInterval(itemDate, {
              start: parseISO(filter.value.start),
              end: parseISO(filter.value.end)
            })
          default:
            return true
        }
      })
    })

    // Gruplama uygula
    let groupedData = {}
    if (analysisParams.groupBy) {
      groupedData = filteredData.reduce((acc, item) => {
        const groupKey = getGroupKey(item, analysisParams.groupBy)
        if (!acc[groupKey]) {
          acc[groupKey] = []
        }
        acc[groupKey].push(item)
        return acc
      }, {})
    } else {
      groupedData = { 'all': filteredData }
    }

    // Metrikleri hesapla
    return Object.entries(groupedData).map(([group, items]) => {
      const result = { name: group }
      analysisParams.metrics.forEach(metric => {
        const metricDef = availableMetrics[analysisParams.dataSource].find(m => m.id === metric)
        if (metricDef) {
          result[metric] = metricDef.calc(items)
        }
      })
      return result
    })
  }, [analysisParams, products, categories, stockMovements, suppliers])

  return (
    <div className="p-6">
      {/* Veri Kaynağı Seçimi */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Veri Kaynağı
        </label>
        <select
          value={analysisParams.dataSource}
          onChange={(e) => setAnalysisParams({
            ...analysisParams,
            dataSource: e.target.value,
            metrics: [],
            groupBy: '',
            filters: []
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Seçiniz</option>
          {dataSources.map(source => (
            <option key={source.id} value={source.id}>{source.name}</option>
          ))}
        </select>
      </div>

      {/* Metrik Seçimi */}
      {analysisParams.dataSource && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metrikler
          </label>
          <div className="space-y-2">
            {availableMetrics[analysisParams.dataSource].map(metric => (
              <label key={metric.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={analysisParams.metrics.includes(metric.id)}
                  onChange={(e) => {
                    const newMetrics = e.target.checked
                      ? [...analysisParams.metrics, metric.id]
                      : analysisParams.metrics.filter(m => m !== metric.id)
                    setAnalysisParams({ ...analysisParams, metrics: newMetrics })
                  }}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2">{metric.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Gruplama Seçimi */}
      {analysisParams.dataSource && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gruplama
          </label>
          <select
            value={analysisParams.groupBy}
            onChange={(e) => setAnalysisParams({ ...analysisParams, groupBy: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Gruplanmamış</option>
            {groupingOptions[analysisParams.dataSource].map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Filtreler */}
      {analysisParams.dataSource && filterOptions[analysisParams.dataSource] && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtreler
          </label>
          <div className="space-y-4">
            {filterOptions[analysisParams.dataSource].map(filter => (
              <div key={filter.id} className="flex items-center gap-4">
                <span className="w-1/4">{filter.name}</span>
                {filter.type === 'select' ? (
                  <select
                    value={analysisParams.filters.find(f => f.id === filter.id)?.value || ''}
                    onChange={(e) => {
                      const newFilters = [
                        ...analysisParams.filters.filter(f => f.id !== filter.id),
                        { id: filter.id, type: filter.type, value: e.target.value }
                      ]
                      setAnalysisParams({ ...analysisParams, filters: newFilters })
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Tümü</option>
                    {filter.options.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                ) : filter.type === 'number' ? (
                  <input
                    type="number"
                    value={analysisParams.filters.find(f => f.id === filter.id)?.value || ''}
                    onChange={(e) => {
                      const newFilters = [
                        ...analysisParams.filters.filter(f => f.id !== filter.id),
                        { id: filter.id, type: filter.type, value: e.target.value }
                      ]
                      setAnalysisParams({ ...analysisParams, filters: newFilters })
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : filter.type === 'daterange' ? (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={analysisParams.filters.find(f => f.id === filter.id)?.value?.start || ''}
                      onChange={(e) => {
                        const currentFilter = analysisParams.filters.find(f => f.id === filter.id)
                        const newFilters = [
                          ...analysisParams.filters.filter(f => f.id !== filter.id),
                          {
                            id: filter.id,
                            type: filter.type,
                            value: { ...currentFilter?.value, start: e.target.value }
                          }
                        ]
                        setAnalysisParams({ ...analysisParams, filters: newFilters })
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="date"
                      value={analysisParams.filters.find(f => f.id === filter.id)?.value?.end || ''}
                      onChange={(e) => {
                        const currentFilter = analysisParams.filters.find(f => f.id === filter.id)
                        const newFilters = [
                          ...analysisParams.filters.filter(f => f.id !== filter.id),
                          {
                            id: filter.id,
                            type: filter.type,
                            value: { ...currentFilter?.value, end: e.target.value }
                          }
                        ]
                        setAnalysisParams({ ...analysisParams, filters: newFilters })
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Görselleştirme Seçimi */}
      {analysisParams.dataSource && analysisParams.metrics.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Görselleştirme
          </label>
          <select
            value={analysisParams.visualization}
            onChange={(e) => setAnalysisParams({ ...analysisParams, visualization: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {visualizationOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Analiz Sonuçları */}
      {analysisData.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold mb-4">Analiz Sonuçları</h3>
            <CSVLink
              data={analysisData}
              filename={`ozel-analiz-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              CSV İndir
            </CSVLink>
          </div>
          {/* Grafik */}
          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              {analysisParams.visualization === 'bar' ? (
                <BarChart data={analysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {analysisParams.metrics.map((metric, index) => (
                    <Bar
                      key={metric}
                      dataKey={metric}
                      name={availableMetrics[analysisParams.dataSource].find(m => m.id === metric)?.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </BarChart>
              ) : analysisParams.visualization === 'line' ? (
                <LineChart data={analysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {analysisParams.metrics.map((metric, index) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={availableMetrics[analysisParams.dataSource].find(m => m.id === metric)?.name}
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))}
                </LineChart>
              ) : analysisParams.visualization === 'pie' ? (
                <PieChart>
                  {analysisParams.metrics.map((metric, index) => (
                    <Pie
                      key={metric}
                      data={analysisData}
                      dataKey={metric}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50 + index * 30}
                      fill={COLORS[index % COLORS.length]}
                      label
                    >
                      {analysisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  ))}
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <AreaChart data={analysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {analysisParams.metrics.map((metric, index) => (
                    <Area
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={availableMetrics[analysisParams.dataSource].find(m => m.id === metric)?.name}
                      fill={COLORS[index % COLORS.length]}
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {analysisParams.groupBy ? 'Grup' : 'Tümü'}
                  </th>
                  {analysisParams.metrics.map(metric => (
                    <th
                      key={metric}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {availableMetrics[analysisParams.dataSource].find(m => m.id === metric)?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.name}
                    </td>
                    {analysisParams.metrics.map(metric => (
                      <td key={metric} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof row[metric] === 'number'
                          ? metric.includes('price') || metric.includes('value')
                            ? new Intl.NumberFormat('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                              }).format(row[metric])
                            : row[metric].toLocaleString('tr-TR')
                          : row[metric]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomAnalysis 