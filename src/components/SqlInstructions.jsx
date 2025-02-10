import React from 'react'
import { toast } from 'react-toastify'

const SqlInstructions = ({ onRetry }) => {
  const sqlCode = `-- Tabloları oluştur
CREATE TABLE IF NOT EXISTS units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('quantity', 'weight', 'volume', 'length', 'area', 'package')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address_street TEXT,
    address_district VARCHAR(255),
    address_city VARCHAR(255),
    address_country VARCHAR(255),
    address_postal_code VARCHAR(20),
    tax_office VARCHAR(255),
    tax_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'passive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS sub_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES categories(id),
    sub_category_id BIGINT REFERENCES sub_categories(id),
    unit_id BIGINT REFERENCES units(id),
    unit_amount NUMERIC(10,2) DEFAULT 1,
    stock_warehouse INTEGER DEFAULT 0,
    stock_shelf INTEGER DEFAULT 0,
    stock_min_level INTEGER DEFAULT 0,
    stock_max_level INTEGER DEFAULT 1000,
    shelf_location VARCHAR(50),
    price_buying NUMERIC(15,2) DEFAULT 0,
    price_selling NUMERIC(15,2) DEFAULT 0,
    price_currency VARCHAR(10) DEFAULT 'TRY',
    vat_rate INTEGER DEFAULT 18,
    supplier_id BIGINT REFERENCES suppliers(id),
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'passive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    product_id BIGINT REFERENCES products(id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_id BIGINT REFERENCES units(id),
    unit_amount NUMERIC(10,2) DEFAULT 1,
    price NUMERIC(15,2) NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    vat_rate INTEGER DEFAULT 18,
    vat_amount NUMERIC(15,2) NOT NULL,
    document_no VARCHAR(50) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(50),
    source_name VARCHAR(255),
    destination_type VARCHAR(50) NOT NULL,
    destination_location VARCHAR(255),
    created_by VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    company_logo TEXT,
    company_address_street TEXT,
    company_address_district VARCHAR(255),
    company_address_city VARCHAR(255),
    company_address_country VARCHAR(255),
    company_address_postal_code VARCHAR(20),
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    inventory_low_stock_warning INTEGER DEFAULT 20,
    inventory_auto_order_threshold INTEGER DEFAULT 10,
    inventory_default_currency VARCHAR(10) DEFAULT 'TRY',
    inventory_default_vat_rate INTEGER DEFAULT 18,
    document_prefix_stock_in VARCHAR(20) DEFAULT 'GIR',
    document_prefix_stock_out VARCHAR(20) DEFAULT 'CIK',
    document_prefix_return VARCHAR(20) DEFAULT 'IAD',
    document_prefix_waste VARCHAR(20) DEFAULT 'FIR',
    document_sequence_stock_in INTEGER DEFAULT 1,
    document_sequence_stock_out INTEGER DEFAULT 1,
    document_sequence_return INTEGER DEFAULT 1,
    document_sequence_waste INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Her tablo için trigger oluştur
CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_categories_updated_at
    BEFORE UPDATE ON sub_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_movements_updated_at
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Mevcut verileri temizle
TRUNCATE TABLE stock_movements, products, sub_categories, categories, suppliers, units, settings CASCADE;

-- Örnek verileri ekle
-- Birimler
INSERT INTO units (name, short_name, type) VALUES
('Adet', 'AD', 'quantity'),
('Kilogram', 'KG', 'weight'),
('Litre', 'LT', 'volume'),
('Metre', 'MT', 'length'),
('Metrekare', 'M2', 'area'),
('Kutu', 'KT', 'package'),
('Paket', 'PK', 'package');

-- Tedarikçiler
INSERT INTO suppliers (name, contact_person, email, phone, address_street, address_district, address_city, address_country, address_postal_code, tax_office, tax_number, status) VALUES
('ABC Ticaret Ltd. Şti.', 'Ahmet Yılmaz', 'info@abcticaret.com', '02125551234', 'Atatürk Cad. No:123', 'Şişli', 'İstanbul', 'Türkiye', '34100', 'Şişli VD', '1234567890', 'active'),
('XYZ Dağıtım A.Ş.', 'Mehmet Demir', 'info@xyzdagitim.com', '02164445678', 'İstiklal Sok. No:45', 'Kadıköy', 'İstanbul', 'Türkiye', '34700', 'Kadıköy VD', '9876543210', 'active');

-- Kategoriler
INSERT INTO categories (name, description, icon) VALUES
('İçecekler', 'Her türlü içecek ürünleri', '🥤'),
('Gıda', 'Yiyecek ürünleri', '🍽️'),
('Temizlik', 'Temizlik malzemeleri', '🧹'),
('Kırtasiye', 'Kırtasiye malzemeleri', '📚'),
('Elektronik', 'Elektronik ürünler', '💻');

-- Alt Kategoriler
INSERT INTO sub_categories (category_id, name, description, icon) VALUES
(1, 'Gazlı İçecekler', 'Gazlı içecek ürünleri', '🥤'),
(1, 'Meyve Suları', 'Meyve suyu ürünleri', '🧃'),
(2, 'Atıştırmalıklar', 'Atıştırmalık ürünler', '🍿'),
(2, 'Temel Gıda', 'Temel gıda ürünleri', '🥫'),
(3, 'Deterjanlar', 'Deterjan ürünleri', '🧼');

-- Ürünler
INSERT INTO products (barcode, name, description, category_id, sub_category_id, unit_id, unit_amount, stock_warehouse, stock_shelf, stock_min_level, stock_max_level, shelf_location, price_buying, price_selling, price_currency, vat_rate, supplier_id, status) VALUES
('8690123456789', 'Cola 2.5L', 'Cola 2.5 litre pet şişe', 1, 1, 1, 1, 100, 20, 30, 200, 'A-01-01', 15.50, 18.90, 'TRY', 18, 1, 'active'),
('8690123456790', 'Portakal Suyu 1L', 'Taze sıkılmış portakal suyu', 1, 2, 3, 1, 80, 15, 20, 150, 'A-01-02', 12.75, 15.90, 'TRY', 18, 1, 'active'),
('8690123456791', 'Cips 150gr', 'Klasik boy cips', 2, 3, 5, 1, 150, 30, 40, 300, 'B-01-01', 8.50, 11.90, 'TRY', 18, 2, 'active');

-- Ayarlar
INSERT INTO settings (company_name, company_logo, company_address_street, company_address_district, company_address_city, company_address_country, company_address_postal_code, company_email, company_phone) VALUES
('Örnek Market', NULL, 'Cumhuriyet Cad. No:1', 'Merkez', 'Ankara', 'Türkiye', '06100', 'info@ornekmarket.com', '03121234567');

-- Sequence değerlerini güncelle
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('sub_categories_id_seq', (SELECT MAX(id) FROM sub_categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));
SELECT setval('units_id_seq', (SELECT MAX(id) FROM units));
SELECT setval('stock_movements_id_seq', (SELECT MAX(id) FROM stock_movements));
SELECT setval('settings_id_seq', (SELECT MAX(id) FROM settings));`

  return (
    <div className="bg-white shadow rounded-lg p-6" data-cy="settings-page-instructions">
      <h2 className="text-lg font-medium mb-4" data-cy="settings-page-instructions-title">Veritabanı Kurulum Adımları</h2>
      <p className="text-sm text-gray-600 mb-4">
        Aşağıdaki SQL kodunu Supabase SQL Editöründe çalıştırarak veritabanı tablolarını ve örnek verileri oluşturabilirsiniz.
        Bu işlem mevcut verileri silecek ve yerine örnek veriler ekleyecektir.
      </p>
      <div className="relative">
        <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
          <code className="language-sql">{sqlCode}</code>
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(sqlCode)
            toast.success('SQL kodu panoya kopyalandı')
          }}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 bg-white rounded-md shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        </button>
      </div>
      <button 
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        data-cy="settings-page-retry-button"
      >
        Tekrar Dene
      </button>
    </div>
  )
}

export default SqlInstructions