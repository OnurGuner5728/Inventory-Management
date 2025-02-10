import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { RealtimeProvider } from './context/RealtimeContext'
import { SupabaseProvider } from './context/SupabaseContext'
import { useSupabase } from './context/SupabaseContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import StockMovements from './pages/StockMovements'
import Counting from './pages/Counting'
import Suppliers from './pages/Suppliers'
import Units from './pages/Units'
import Settings from './pages/Settings'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AppContent = () => {
    const { isConfigured, loading } = useSupabase()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Yükleniyor...</div>
            </div>
        )
    }

    if (!isConfigured) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Settings />
                </main>
            </div>
        )
    }

    return (
        <DataProvider>
            <RealtimeProvider>
                <ToastContainer />
                <Router>
                    <div className="min-h-screen bg-gray-50">
                        <Navbar />
                        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/categories" element={<Categories />} />
                                <Route path="/stock-movements" element={<StockMovements />} />
                                <Route path="/counting" element={<Counting />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/units" element={<Units />} />
                                <Route path="/settings" element={<Settings />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </RealtimeProvider>
        </DataProvider>
    )
}

function App() {
    return (
        <SupabaseProvider>
            <ToastContainer />
            <AppContent />
        </SupabaseProvider>
    )
}

export default App