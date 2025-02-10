import supabase from './supabase'

const add = async (supplierData) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{
      name: supplierData.name,
      contact_person: supplierData.contact_person,
      email: supplierData.email,
      phone: supplierData.phone,
      address_street: supplierData.address_street,
      address_district: supplierData.address_district,
      address_city: supplierData.address_city,
      address_country: supplierData.address_country,
      address_postal_code: supplierData.address_postal_code,
      tax_office: supplierData.tax_office,
      tax_number: supplierData.tax_number,
      status: supplierData.status
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

const update = async (id, supplierData) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: supplierData.name,
      contact_person: supplierData.contact_person,
      email: supplierData.email,
      phone: supplierData.phone,
      address_street: supplierData.address_street,
      address_district: supplierData.address_district,
      address_city: supplierData.address_city,
      address_country: supplierData.address_country,
      address_postal_code: supplierData.address_postal_code,
      tax_office: supplierData.tax_office,
      tax_number: supplierData.tax_number,
      status: supplierData.status
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

const deleteSupplier = async (id) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export default {
  add,
  update,
  delete: deleteSupplier
} 