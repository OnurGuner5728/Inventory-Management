import { Link, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation()

    const links = [
        { name: 'Dashboard', path: '/' },
        { name: 'Ürünler', path: '/products' },
        { name: 'Kategoriler', path: '/categories' },
        { name: 'Stok Hareketleri', path: '/stock-movements' },
        { name: 'Stok Sayımı', path: '/counting' },
        { name: 'Tedarikçiler', path: '/suppliers' },
        { name: 'Birimler', path: '/units' },
        { name: 'Ayarlar', path: '/settings' },

    ]



    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-xl font-bold text-primary-600">
                                Envanter Yönetimi
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`${
                                        location.pathname === link.path
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        <span className="text-sm text-gray-500">
                            Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobil menü */}
            <div className="sm:hidden">
                <div className="pt-2 pb-3 space-y-1">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                location.pathname === link.path
                                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}

export default Navbar