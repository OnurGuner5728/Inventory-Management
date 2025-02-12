import { createClient } from '@supabase/supabase-js'

// Supabase istemcisini dışarıdan alacağız
let supabase = null

export const setSupabaseClient = (client) => {
  supabase = client
}

export { supabase }

const generateBarcode = () => {
  const prefix = '869' // Türkiye ülke kodu
  const timestamp = Date.now().toString().slice(-9)
  const randomDigit = Math.floor(Math.random() * 10)
  const barcode = prefix + timestamp + randomDigit

  // Check digit hesaplama (EAN-13)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10

  return barcode + checkDigit
}

// Kategori işlemleri
export const categoryOperations = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, sub_categories(*)')
    if (error) throw error
    return data
  },
  
  add: async (category) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: category.name,
        description: category.description,
        icon: category.icon
      }])
      .select()
    if (error) throw error
    return data[0]
  },
  
  update: async (id, category) => {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        description: category.description,
        icon: category.icon
      })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}

// Alt kategori işlemleri
export const subCategoryOperations = {
  add: async (categoryId, subCategory) => {
    const { data, error } = await supabase
      .from('sub_categories')
      .insert([{
        category_id: categoryId,
        name: subCategory.name,
        description: subCategory.description,
        icon: subCategory.icon
      }])
      .select()
    if (error) throw error
    return data[0]
  },
  
  update: async (id, subCategory) => {
    const { data, error } = await supabase
      .from('sub_categories')
      .update({
        name: subCategory.name,
        description: subCategory.description,
        icon: subCategory.icon
      })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('sub_categories')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}

// Ürün işlemleri
export const productOperations = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*),
        sub_categories(*),
        suppliers(*),
        units(*)
      `)
    if (error) throw error
    return data
  },
  
  add: async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        barcode: generateBarcode(),
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        sub_category_id: product.sub_category_id,
        unit_id: product.unit_id,
        unit_amount: product.unit_amount,
        stock_warehouse: product.stock_warehouse,
        stock_shelf: product.stock_shelf,
        stock_min_level: product.stock_min_level,
        stock_max_level: product.stock_max_level,
        shelf_location: product.shelf_location,
        price_buying: product.price_buying,
        price_selling: product.price_selling,
        price_currency: product.price_currency,
        vat_rate: product.vat_rate,
        supplier_id: product.supplier_id,
        expiry_date: product.expiry_date,
        status: product.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
    if (error) throw error
    return data[0]
  },
  
  update: async (id, data) => {
    console.log('Supabase - Ürün güncelleme verisi:', data)
    
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        barcode: data.barcode,  // Barkodu açıkça belirt
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        sub_category_id: data.sub_category_id,
        unit_id: data.unit_id,
        unit_amount: data.unit_amount,
        stock_warehouse: data.stock_warehouse,
        stock_shelf: data.stock_shelf,
        stock_min_level: data.stock_min_level,
        stock_max_level: data.stock_max_level,
        shelf_location: data.shelf_location,
        price_buying: data.price_buying,
        price_selling: data.price_selling,
        price_currency: data.price_currency,
        vat_rate: data.vat_rate,
        supplier_id: data.supplier_id,
        expiry_date: data.expiry_date,
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase - Ürün güncelleme hatası:', error)
      throw error
    }

    return updatedProduct
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}

// Stok hareketi işlemleri
export const stockMovementOperations = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products(*),
        units(*)
      `)
    if (error) throw error
    return data
  },
  
  add: async (movement) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([{
        type: movement.type,
        product_id: movement.product_id,
        quantity: movement.quantity,
        unit_id: movement.unit_id,
        unit_amount: movement.unit_amount,
        price: movement.price,
        total_price: movement.total_price,
        vat_rate: movement.vat_rate,
        vat_amount: movement.vat_amount,
        document_no: movement.document_no,
        description: movement.description,
        source_type: movement.source_type,
        source_id: movement.source_id,
        source_name: movement.source_name,
        destination_type: movement.destination_type,
        destination_location: movement.destination_location,
        created_by: movement.created_by,
        status: movement.status,
        created_at: movement.created_at
      }])
      .select()
    if (error) throw error
    return data[0]
  },

  deleteByProductId: async (productId) => {
    const { error } = await supabase
      .from('stock_movements')
      .delete()
      .eq('product_id', productId)
    if (error) throw error
    return true
  }
}

// Tedarikçi işlemleri
export const supplierOperations = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
    if (error) throw error
    return data
  },
  
  add: async (supplier) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: supplier.name,
        contact_person: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address_street: supplier.address_street,
        address_district: supplier.address_district,
        address_city: supplier.address_city,
        address_country: supplier.address_country,
        address_postal_code: supplier.address_postal_code,
        tax_office: supplier.tax_office,
        tax_number: supplier.tax_number,
        status: supplier.status
      }])
      .select()
    if (error) throw error
    return data[0]
  },
  
  update: async (id, supplier) => {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: supplier.name,
        contact_person: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address_street: supplier.address_street,
        address_district: supplier.address_district,
        address_city: supplier.address_city,
        address_country: supplier.address_country,
        address_postal_code: supplier.address_postal_code,
        tax_office: supplier.tax_office,
        tax_number: supplier.tax_number,
        status: supplier.status
      })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}

// Birim işlemleri
export const unitOperations = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
    if (error) throw error
    return data
  },
  
  add: async (unit) => {
    const { data, error } = await supabase
      .from('units')
      .insert([{
        name: unit.name,
        short_name: unit.short_name,
        type: unit.type
      }])
      .select()
    if (error) throw error
    return data[0]
  },

  update: async (id, unit) => {
    const { data, error } = await supabase
      .from('units')
      .update({
        name: unit.name,
        short_name: unit.short_name,
        type: unit.type
      })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}

// Ayarlar işlemleri
export const settingsOperations = {
  get: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()
    if (error) throw error
    return data
  },
  
  update: async (settings) => {
    const { data, error } = await supabase
      .from('settings')
      .update({
        company_name: settings.company.name,
        company_logo: settings.company.logo,
        company_address_street: settings.company.address.street,
        company_address_district: settings.company.address.district,
        company_address_city: settings.company.address.city,
        company_address_country: settings.company.address.country,
        company_address_postal_code: settings.company.address.postalCode,
        company_email: settings.company.contact.email,
        company_phone: settings.company.contact.phone,
        inventory_low_stock_warning: settings.inventory.lowStockWarningPercentage,
        inventory_auto_order_threshold: settings.inventory.autoOrderThreshold,
        inventory_default_currency: settings.inventory.defaultCurrency,
        inventory_default_vat_rate: settings.inventory.defaultVatRate,
        document_prefix_stock_in: settings.inventory.documentNumberPrefix.stockIn,
        document_prefix_stock_out: settings.inventory.documentNumberPrefix.stockOut,
        document_prefix_return: settings.inventory.documentNumberPrefix.return,
        document_prefix_waste: settings.inventory.documentNumberPrefix.waste,
        document_sequence_stock_in: settings.inventory.documentNumberSequence.stockIn,
        document_sequence_stock_out: settings.inventory.documentNumberSequence.stockOut,
        document_sequence_return: settings.inventory.documentNumberSequence.return,
        document_sequence_waste: settings.inventory.documentNumberSequence.waste
      })
      .eq('id', 1)
      .select()
    if (error) throw error
    return data[0]
  }
} 