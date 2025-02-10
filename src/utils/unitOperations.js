import supabase from './supabase'

const add = async (unitData) => {
  const { data, error } = await supabase
    .from('units')
    .insert([{
      name: unitData.name,
      short_name: unitData.short_name,
      type: unitData.type,
      status: unitData.status
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

const update = async (id, unitData) => {
  const { data, error } = await supabase
    .from('units')
    .update({
      name: unitData.name,
      short_name: unitData.short_name,
      type: unitData.type,
      status: unitData.status
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

const delete = async (id) => {
  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export default {
  add,
  update,
  delete
} 