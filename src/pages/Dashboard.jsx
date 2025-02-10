import { useState, useMemo, useCallback } from 'react'
import { useData } from '../context/DataContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts'
import { CSVLink } from 'react-csv'
import { format, subDays, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { FiDownload } from 'react-icons/fi'
import CustomAnalysis from '../components/CustomAnalysis'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

// Yeni CollapsibleSection bileşeni
const CollapsibleSection = ({ title, description, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-8 border rounded-lg">
      <div onClick={() => setOpen(!open)} className="flex justify-between items-center p-4 bg-gray-100 cursor-pointer">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="text-2xl">{open ? '-' : '+'}</span>
      </div>
      {open && (
        <div className="p-4">
          {description && <p className="mb-4 text-sm text-gray-600">{description}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

function Dashboard() {
  const { products, categories, stockMovements, units, suppliers } = useData()
  const [timeRange, setTimeRange] = useState('week') // week, month, year
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [analysisType, setAnalysisType] = useState('all') // all, sales, stock, financial
  const [dateRange, setDateRange] = useState({ start: null, end: null })

  // Tarih aralığı hesaplama
  const getDateRange = useCallback(() => {
    const end = new Date()
    let start = new Date()
    
    switch(timeRange) {
      case 'week':
        start = subDays(end, 7)
        break
      case 'month':
        start = subMonths(end, 1)
        break
      case 'year':
        start = subMonths(end, 12)
        break
      default:
        start = subDays(end, 7)
    }
    
    return { start, end }
  }, [timeRange])

  // Para formatı
  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }

  // Stok değeri hesaplama (Kategoriye göre filtrelenmiş)
  const stockValue = useMemo(() => {
    return products
      .filter(product => selectedCategory === 'all' || product.category_id === Number(selectedCategory))
      .reduce((sum, product) => {
        const totalStock = (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0)
        const buyingPrice = Number(product?.price_buying) || 0
        return sum + (totalStock * buyingPrice)
      }, 0)
  }, [products, selectedCategory])

  // Kritik stok analizi
  const criticalStock = useMemo(() => {
    return products
      .filter(product => {
        if (selectedCategory !== 'all' && product.category_id !== Number(selectedCategory)) return false
        const currentStock = (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0)
        const minStockLevel = Number(product?.stock_min_level) || 0
        return currentStock <= minStockLevel
      })
      .map(product => ({
        ...product,
        currentStock: (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0),
        minLevel: Number(product?.stock_min_level) || 0,
        stockValue: ((Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0)) * (Number(product?.price_buying) || 0)
      }))
  }, [products, selectedCategory])

  // Satış performans analizi (Sayım hareketleri hariç)
  const salesPerformance = useMemo(() => {
    const { start, end } = getDateRange()
    
    const filteredMovements = stockMovements.filter(movement => {
      const moveDate = new Date(movement.created_at)
      return (
        isWithinInterval(moveDate, { start: startOfDay(start), end: endOfDay(end) }) &&
        movement.type === 'OUT' &&
        movement.destination_type !== 'COUNT_SHORTAGE' // Sayım eksiklerini hariç tut
      )
    })

    const analysis = products
      .filter(product => selectedCategory === 'all' || product.category_id === Number(selectedCategory))
      .map(product => {
        const productMovements = filteredMovements.filter(m => m.product_id === product.id)
        const totalQuantity = productMovements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
        const totalRevenue = productMovements.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)

      return {
        id: product.id,
        name: product.name,
          totalQuantity,
          totalRevenue,
          averagePrice: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
          movementCount: productMovements.length,
          performance: totalQuantity > 10 ? 'Yüksek' : totalQuantity > 5 ? 'Orta' : 'Düşük'
        }
      })
      .filter(item => item.totalQuantity > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    return {
      topSellers: analysis.slice(0, 5),
      totalRevenue: analysis.reduce((sum, item) => sum + item.totalRevenue, 0),
      averageOrderValue: analysis.length > 0 ? 
        analysis.reduce((sum, item) => sum + item.totalRevenue, 0) / analysis.length : 0
    }
  }, [products, stockMovements, selectedCategory, timeRange])

  // Kategori bazlı stok analizi
  const categoryAnalysis = useMemo(() => {
    const analysis = categories.map(category => {
      const categoryProducts = products.filter(p => p.category_id === category.id)
      const totalStock = categoryProducts.reduce((sum, product) => {
        return sum + (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0)
      }, 0)
      const totalValue = categoryProducts.reduce((sum, product) => {
        const stock = (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0)
        return sum + (stock * (Number(product?.price_buying) || 0))
      }, 0)

      return {
        name: category.name,
        totalStock,
        totalValue,
        productCount: categoryProducts.length,
        averageValue: categoryProducts.length > 0 ? totalValue / categoryProducts.length : 0
      }
    })

    return analysis.sort((a, b) => b.totalValue - a.totalValue)
  }, [categories, products])

  // Stok hareket analizi (Sayım hareketleri ayrı)
  const movementAnalysis = useMemo(() => {
    const { start, end } = getDateRange()
    
    const movements = stockMovements.filter(movement => {
      const moveDate = new Date(movement.created_at)
      return isWithinInterval(moveDate, { start: startOfDay(start), end: endOfDay(end) })
    })

    const regularMovements = movements.filter(m => 
      m.destination_type !== 'COUNT_SHORTAGE' && 
      m.source_type !== 'COUNT_SURPLUS'
    )

    const countingMovements = movements.filter(m => 
      m.destination_type === 'COUNT_SHORTAGE' || 
      m.source_type === 'COUNT_SURPLUS'
      )

      return {
      regular: {
        in: regularMovements.filter(m => m.type === 'IN'),
        out: regularMovements.filter(m => m.type === 'OUT'),
        total: regularMovements.length,
        totalValue: regularMovements.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
      },
      counting: {
        shortage: countingMovements.filter(m => m.destination_type === 'COUNT_SHORTAGE'),
        surplus: countingMovements.filter(m => m.source_type === 'COUNT_SURPLUS'),
        total: countingMovements.length,
        totalValue: countingMovements.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
      }
    }
  }, [stockMovements, timeRange])

  // Stok hareketleri analizi - Sayım hareketleri ayrı
  const detailedMovementAnalysis = useMemo(() => {
    const { start, end } = getDateRange()
    
    const movements = stockMovements.filter(movement => {
      const moveDate = new Date(movement.created_at)
      return isWithinInterval(moveDate, { start: startOfDay(start), end: endOfDay(end) })
    })

    // Normal hareketler ve sayım hareketlerini ayır
    const regularMovements = movements.filter(m => 
      m.destination_type !== 'COUNT_SHORTAGE' && 
      m.source_type !== 'COUNT_SURPLUS'
    )

    const countingMovements = movements.filter(m => 
      m.destination_type === 'COUNT_SHORTAGE' || 
      m.source_type === 'COUNT_SURPLUS'
    )

    // Detaylı analiz
    return {
      regular: {
        in: {
          count: regularMovements.filter(m => m.type === 'IN').length,
          value: regularMovements
            .filter(m => m.type === 'IN')
            .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
        },
        out: {
          count: regularMovements.filter(m => m.type === 'OUT').length,
          value: regularMovements
            .filter(m => m.type === 'OUT')
            .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
        },
        return: {
          count: regularMovements.filter(m => m.type === 'RETURN').length,
          value: regularMovements
            .filter(m => m.type === 'RETURN')
            .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
        }
      },
      counting: {
        shortage: {
          count: countingMovements.filter(m => m.destination_type === 'COUNT_SHORTAGE').length,
          value: countingMovements
            .filter(m => m.destination_type === 'COUNT_SHORTAGE')
            .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
        },
        surplus: {
          count: countingMovements.filter(m => m.source_type === 'COUNT_SURPLUS').length,
          value: countingMovements
            .filter(m => m.source_type === 'COUNT_SURPLUS')
            .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
        }
      }
    }
  }, [stockMovements, timeRange])

  // Detaylı finansal analiz
  const detailedFinancialAnalysis = useMemo(() => {
    const { start, end } = getDateRange()
    
    const relevantMovements = stockMovements.filter(movement => {
      const moveDate = new Date(movement.created_at)
      return isWithinInterval(moveDate, { start: startOfDay(start), end: endOfDay(end) })
    })

    return {
      sales: {
        regular: relevantMovements
          .filter(m => m.type === 'OUT' && m.destination_type !== 'COUNT_SHORTAGE')
          .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0),
        counting: relevantMovements
          .filter(m => m.destination_type === 'COUNT_SHORTAGE')
          .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
      },
      purchases: relevantMovements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0),
      returns: relevantMovements
        .filter(m => m.type === 'RETURN')
        .reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
    }
  }, [stockMovements, timeRange])

  // Tedarikçi performans analizi
  const supplierPerformanceAnalysis = useMemo(() => {
    return Object.values(products.reduce((acc, product) => {
      const supplier = suppliers.find(s => s.id === product.supplier_id)
      const supplier_id = product.supplier_id || 'BELIRSIZ'
      
      if (!acc[supplier_id]) {
        acc[supplier_id] = {
          id: supplier_id,
          name: supplier?.name || 'Belirsiz Tedarikçi',
          productCount: 0,
          totalValue: 0,
          stockoutCount: 0,
          averageDeliveryTime: 0
        }
      }
      
      acc[supplier_id].productCount++
      const stockValue = (Number(product.stock_warehouse) + Number(product.stock_shelf)) * 
                        Number(product.price_buying)
      acc[supplier_id].totalValue += stockValue
      
      if ((Number(product.stock_warehouse) + Number(product.stock_shelf)) <= 
          Number(product.stock_min_level)) {
        acc[supplier_id].stockoutCount++
      }

      return acc
    }, {}))
  }, [products, suppliers])

  // Analiz tipine göre görüntüleme kontrolü için fonksiyonu güncelle
  const shouldShowAnalysis = (type, currentFilter) => {
    if (currentFilter === 'all') return true
    
    const analysisTypes = {
      sales: ['salesPerformance', 'revenueAnalysis', 'customerBehavior'],
      stock: ['stockValue', 'criticalStock', 'stockMovement', 'locationAnalysis'],
      financial: ['profitLoss', 'supplierCosts', 'cashFlow']
    }
    
    return analysisTypes[currentFilter]?.includes(type)
  }

  // Yeni analizler için useMemo hooks'ları
  const productProfitabilityAnalysis = useMemo(() => {
    return products.map(product => {
      const sales = stockMovements
        .filter(m => m.product_id === product.id && m.type === 'OUT')
      
      const totalRevenue = sales.reduce((sum, sale) => sum + (Number(sale.total_price) || 0), 0)
      const totalCost = sales.reduce((sum, sale) => {
        return sum + ((Number(sale.quantity) || 0) * (Number(product.price_buying) || 0))
      }, 0)
      
      return {
        id: product.id,
        name: product.name,
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalRevenue - totalCost,
        margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
      }
    }).sort((a, b) => b.profit - a.profit)
  }, [products, stockMovements])

  const stockAgingAnalysis = useMemo(() => {
    const now = new Date()
    return products.map(product => {
      const lastMovement = stockMovements
        .filter(m => m.product_id === product.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      
      const daysSinceLastMovement = lastMovement 
        ? Math.floor((now - new Date(lastMovement.created_at)) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: product.id,
        name: product.name,
        currentStock: (Number(product.stock_warehouse) || 0) + (Number(product.stock_shelf) || 0),
        daysSinceLastMovement,
        stockValue: (Number(product.stock_warehouse) + Number(product.stock_shelf)) * Number(product.price_buying),
        status: daysSinceLastMovement > 90 ? 'Durağan' : daysSinceLastMovement > 30 ? 'Normal' : 'Aktif'
      }
    }).sort((a, b) => b.daysSinceLastMovement - a.daysSinceLastMovement)
  }, [products, stockMovements])

  const locationOptimizationAnalysis = useMemo(() => {
    return products.map(product => {
      const warehouseStock = Number(product.stock_warehouse) || 0
      const shelfStock = Number(product.stock_shelf) || 0
      const totalStock = warehouseStock + shelfStock
      const shelfRatio = totalStock > 0 ? (shelfStock / totalStock) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        warehouseStock,
        shelfStock,
        shelfRatio,
        recommendation: shelfRatio < 20 ? 'Rafa Taşı' : shelfRatio > 80 ? 'Depoya Al' : 'İdeal'
      }
    }).sort((a, b) => a.shelfRatio - b.shelfRatio)
  }, [products])

  const seasonalityAnalysis = useMemo(() => {
    const monthlyData = {}

    stockMovements.forEach(movement => {
      if (movement.type !== 'OUT') return
      
      const month = new Date(movement.created_at).getMonth()
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: format(new Date(2024, month, 1), 'MMMM', { locale: tr }),
          sales: 0,
          revenue: 0,
          transactions: 0
        }
      }
      
      monthlyData[month].sales += Number(movement.quantity) || 0
      monthlyData[month].revenue += Number(movement.total_price) || 0
      monthlyData[month].transactions++
    })
    
    return Object.values(monthlyData)
  }, [stockMovements])

  const categoryPerformanceAnalysis = useMemo(() => {
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.category_id === category.id)
      const movements = stockMovements.filter(m => 
        categoryProducts.some(p => p.id === m.product_id) && m.type === 'OUT'
      )
      
      const totalRevenue = movements.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0)
      const totalQuantity = movements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
      
      return {
        id: category.id,
        name: category.name,
        productCount: categoryProducts.length,
        totalRevenue,
        totalQuantity,
        averagePrice: totalQuantity > 0 ? totalRevenue / totalQuantity : 0
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [categories, products, stockMovements])

  // CSV verilerini hazırlama
  const prepareCSVData = (data, type) => {
    switch(type) {
      case 'criticalStock':
        return data.map(item => ({
          'Ürün Adı': item.name,
          'Mevcut Stok': item.currentStock,
          'Minimum Stok': item.minLevel,
          'Stok Değeri': formatPrice(item.stockValue)
        }))
      case 'salesPerformance':
        return data.map(item => ({
          'Ürün Adı': item.name,
          'Toplam Satış Adedi': item.totalQuantity,
          'Toplam Gelir': formatPrice(item.totalRevenue),
          'Ortalama Fiyat': formatPrice(item.averagePrice),
          'Performans': item.performance
        }))
      // Diğer veri tipleri için case'ler eklenebilir
      default:
        return []
    }
  }

  return (
    <div className="p-6">
      {/* Global Filtreler */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="week">Son 7 Gün</option>
          <option value="month">Son 30 Gün</option>
          <option value="year">Son 1 Yıl</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">Tüm Analizler</option>
          <option value="sales">Satış Analizleri</option>
          <option value="stock">Stok Analizleri</option>
          <option value="financial">Finansal Analizler</option>
        </select>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Toplam Stok Değeri</h3>
          <p className="text-2xl font-bold text-blue-600">{formatPrice(stockValue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Kritik Stok Sayısı</h3>
          <p className="text-2xl font-bold text-red-600">{criticalStock.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Dönem Satış Geliri</h3>
          <p className="text-2xl font-bold text-green-600">{formatPrice(salesPerformance.totalRevenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Ortalama Sipariş Değeri</h3>
          <p className="text-2xl font-bold text-purple-600">{formatPrice(salesPerformance.averageOrderValue)}</p>
        </div>
      </div>

      {/* Satış Performansı */}
      <CollapsibleSection
         title="Satış Performansı"
         description="Bu analiz, seçili zaman aralığında ürünlerin satış performansını gösterir. Toplam satış adedi, satış geliri ve ortalama sipariş değeri hesaplamaları yapılır."
      >
        <div className="flex justify-between items-center mb-4">
          <CSVLink
            data={prepareCSVData(salesPerformance.topSellers, 'salesPerformance')}
            filename={`satis-performansi-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            CSV İndir
          </CSVLink>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={salesPerformance.topSellers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalRevenue" name="Toplam Gelir" fill="#8884d8" />
            <Bar dataKey="totalQuantity" name="Satış Adedi" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CollapsibleSection>

      {/* Kategori Analizi */}
      <CollapsibleSection
         title="Kategori Analizi"
         description="Bu analiz, ürün kategorilerine göre stok değerini hesaplar ve karşılaştırır."
      >
        <div className="flex justify-between items-center mb-4">
          <CSVLink
            data={categoryAnalysis}
            filename={`kategori-analizi-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            CSV İndir
          </CSVLink>
        </div>
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
              data={categoryAnalysis}
                dataKey="totalValue"
                nameKey="name"
                cx="50%"
                cy="50%"
              outerRadius={150}
              label
              >
              {categoryAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
      </CollapsibleSection>

      {/* Stok Hareket Analizi */}
      <CollapsibleSection
         title="Stok Hareket Analizi"
         description="Stok hareketlerinin giriş ve çıkış işlemleri burada analiz edilmiştir."
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Stok Hareket Analizi</h2>
          <div className="flex gap-2">
            <CSVLink
              data={movementAnalysis.regular.in}
              filename={`stok-giris-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Giriş Hareketleri
            </CSVLink>
            <CSVLink
              data={movementAnalysis.regular.out}
              filename={`stok-cikis-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Çıkış Hareketleri
            </CSVLink>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Normal Hareketler</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { name: 'Giriş', value: movementAnalysis.regular.in.length },
                { name: 'Çıkış', value: movementAnalysis.regular.out.length }
              ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" fill="#8884d8" />
              </AreaChart>
          </ResponsiveContainer>
      </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Sayım Hareketleri</h3>
          <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { name: 'Fazla', value: movementAnalysis.counting.surplus.length },
                { name: 'Eksik', value: movementAnalysis.counting.shortage.length }
              ]}>
              <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
              <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
      </CollapsibleSection>

      {/* Kritik Stok Durumu */}
      <CollapsibleSection
         title="Kritik Stok Durumu"
         description="Ürünlerin kritik stok seviyelerine göre analiz yapılmaktadır."
      >
        <div className="flex justify-between items-center mb-4">
          <CSVLink
            data={prepareCSVData(criticalStock, 'criticalStock')}
            filename={`kritik-stok-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            CSV İndir
          </CSVLink>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Adı
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mevcut Stok
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Minimum Stok
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Değeri
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {criticalStock.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.minLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(item.stockValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Detaylı Stok Hareket Analizi */}
      <CollapsibleSection
         title="Detaylı Stok Hareket Analizi"
         description="Normal ve sayım hareketlerinin detaylı analizi yapılmaktadır."
      >
        <div className="flex justify-between items-center mb-4">
          <CSVLink
            data={[{ ...detailedMovementAnalysis.regular, ...detailedMovementAnalysis.counting }]}
            filename={`stok-hareket-analizi-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            CSV İndir
          </CSVLink>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Normal Hareketler</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span>Giriş İşlemleri:</span>
                <span className="font-semibold">
                  {detailedMovementAnalysis.regular.in.count} adet / 
                  {formatPrice(detailedMovementAnalysis.regular.in.value)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span>Çıkış İşlemleri:</span>
                <span className="font-semibold">
                  {detailedMovementAnalysis.regular.out.count} adet / 
                  {formatPrice(detailedMovementAnalysis.regular.out.value)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span>İade İşlemleri:</span>
                <span className="font-semibold">
                  {detailedMovementAnalysis.regular.return.count} adet / 
                  {formatPrice(detailedMovementAnalysis.regular.return.value)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Sayım Hareketleri</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span>Sayım Fazlası:</span>
                <span className="font-semibold text-green-600">
                  {detailedMovementAnalysis.counting.surplus.count} adet / 
                  {formatPrice(detailedMovementAnalysis.counting.surplus.value)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span>Sayım Eksiği:</span>
                <span className="font-semibold text-red-600">
                  {detailedMovementAnalysis.counting.shortage.count} adet / 
                  {formatPrice(Math.abs(detailedMovementAnalysis.counting.shortage.value))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Detaylı Finansal Analiz */}
      <CollapsibleSection
         title="Detaylı Finansal Analiz"
         description="Satış, alım ve iadeler temelinde detaylı finansal analiz yapılmaktadır."
      >
        <h2 className="text-xl font-bold mb-6">Detaylı Finansal Analiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-2">Satışlar</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Normal Satışlar:</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(detailedFinancialAnalysis.sales.regular)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sayım Farkları:</span>
                <span className="font-semibold text-red-600">
                  {formatPrice(detailedFinancialAnalysis.sales.counting)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-2">Alımlar</h3>
            <div className="flex justify-between">
              <span>Toplam Alım:</span>
              <span className="font-semibold">
                {formatPrice(detailedFinancialAnalysis.purchases)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-2">İadeler</h3>
            <div className="flex justify-between">
              <span>Toplam İade:</span>
              <span className="font-semibold">
                {formatPrice(detailedFinancialAnalysis.returns)}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Tedarikçi Performans Analizi */}
      <CollapsibleSection
         title="Tedarikçi Performans Analizi"
         description="Tedarikçi bazında ürün sayısı, toplam değer ve kritik stok analizi yapılmaktadır."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tedarikçi ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Değer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kritik Stok
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(supplierPerformanceAnalysis).map(supplier => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.productCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(supplier.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.stockoutCount} ürün
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Ürün Karlılık Analizi */}
      {shouldShowAnalysis('profitLoss', analysisType) && (
        <CollapsibleSection
          title="Ürün Karlılık Analizi"
          description="Ürünlerin karlılığı, gelir, maliyet ve kar marjı hesaplamalarıyla gösterilmektedir."
        >
          <div className="flex justify-between items-center mb-6">
            <CSVLink
              data={productProfitabilityAnalysis}
              filename={`urun-karlilik-analizi-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FiDownload /> İndir
            </CSVLink>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gelir
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maliyet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kar Marjı
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {productProfitabilityAnalysis.slice(0, 10).map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(item.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(item.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(item.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.margin.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Stok Yaşlandırma Analizi */}
      {shouldShowAnalysis('stockValue', analysisType) && (
        <CollapsibleSection
          title="Stok Yaşlandırma Analizi"
          description="Stokların en son hareket tarihine göre yaşlandırma analizi yapılmaktadır."
        >
          <div className="flex justify-between items-center mb-6">
            <CSVLink
              data={stockAgingAnalysis}
              filename={`stok-yaslandirma-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FiDownload /> İndir
            </CSVLink>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mevcut Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Son Hareket (Gün)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Değeri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {stockAgingAnalysis.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.currentStock}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.daysSinceLastMovement}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(item.stockValue)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Durağan' ? 'bg-red-100 text-red-800' :
                          item.status === 'Normal' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Lokasyon Optimizasyon Analizi */}
      {shouldShowAnalysis('stockMovement', analysisType) && (
        <CollapsibleSection
          title="Lokasyon Optimizasyon Analizi"
          description="Depo ve raf stoklarına dayalı olarak ürünlerin yer optimizasyonu analizi yapılmaktadır."
        >
          <div className="flex justify-between items-center mb-6">
            <CSVLink
              data={locationOptimizationAnalysis}
              filename={`lokasyon-optimizasyon-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FiDownload /> İndir
            </CSVLink>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Depo Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raf Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raf Oranı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öneri
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {locationOptimizationAnalysis.map(item => (
                  <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.warehouseStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.shelfStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.shelfRatio.toFixed(2)}%
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.recommendation === 'Rafa Taşı' ? 'bg-blue-100 text-blue-800' :
                          item.recommendation === 'Depoya Al' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.recommendation}
                        </span>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Mevsimsellik Analizi */}
      {shouldShowAnalysis('sales', analysisType) && (
        <CollapsibleSection
          title="Mevsimsellik Analizi"
          description="Ay bazında satış adedi ve gelir analizi mevsimsellik açısından incelenmektedir."
        >
          <div className="flex justify-between items-center mb-6">
            <CSVLink
              data={seasonalityAnalysis}
              filename={`mevsimsellik-analizi-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FiDownload /> İndir
            </CSVLink>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={seasonalityAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" name="Satış Adedi" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="revenue" name="Gelir" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CollapsibleSection>
      )}

      {/* Kategori Performans Analizi */}
      {shouldShowAnalysis('sales', analysisType) && (
        <CollapsibleSection
          title="Kategori Performans Analizi"
          description="Kategori bazında ürün sayısı, toplam gelir ve ortalama fiyat analizleri yapılmaktadır."
        >
          <div className="flex justify-between items-center mb-6">
            <CSVLink
              data={categoryPerformanceAnalysis}
              filename={`kategori-performans-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FiDownload /> İndir
            </CSVLink>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPerformanceAnalysis}
                    dataKey="totalRevenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {categoryPerformanceAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ürün Sayısı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Toplam Gelir
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ortalama Fiyat
                        </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                      {categoryPerformanceAnalysis.map(item => (
                    <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.productCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(item.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(item.averagePrice)}
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Özel Analiz */}
      <CollapsibleSection
        title="Özel Analiz"
        description="Bu modülde, seçilen veri kaynaklarına, metriklere ve filtre seçeneklerine bağlı olarak dinamik analiz sonuçları hesaplanır. Grafik ve tablo şeklinde sonuçları görebilir, CSV formatında indirebilirsiniz."
      >
        <CustomAnalysis />
      </CollapsibleSection>
    </div>
  )
}

export default Dashboard 