import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import { toast } from 'react-toastify'
const EMOJI_LIST = [
  '📦', '🛍️', '🎁', '🥤', '🍽️', '🍴', '🥄', '🍺', '🍷', '🥃', '🍸',
  '🍹', '🧃', '🧋', '🍶', '🥛', '☕', '🫖', '🍵', '🧉', '🥂',
  '🍾', '🥫', '🍪', '🍩', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍡',
  '🍯', '🍼', '🥚', '🍗', '🍖', '🍕', '🌭', '🍔', '🍟', '🥨',
  '🥐', '🥖', '🥯', '🧀', '🥙', '🥪', '🌮', '🌯', '🫔',
  '🍝', '🥘', '🫕', '🥣', '🍲', '🍛', '🍜', '🍢', '🍱', '🍚',
  '🍘', '🍙', '🍤', '🍣', '🦪', '🍥', '🥠', '🥡', '🍧', '🍨', '🍦',
  '🎂', '🌰', '🥜', '🫘', '🌱', '🪴', '🌿', '☘️', '🍀', '🎍', '🎋', 
  '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '��', 
  '🌼', '🌻'
]

function CategoryModal({ isOpen, onClose, category, subCategory, modalType }) {
  const { addCategory, updateCategory, addSubCategory, updateSubCategory } = useRealtime()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦'
  })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (modalType === 'category' && category) {
      setFormData({
        name: category.name,
        description: category.description,
        icon: category.icon
      })
    } else if (modalType === 'subcategory' && subCategory) {
      setFormData({
        name: subCategory.name,
        description: subCategory.description,
        icon: subCategory.icon
      })
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '📦'
      })
    }
  }, [category, subCategory, modalType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (modalType === 'category') {
        if (category) {
          await updateCategory(category.id, formData)
        } else {
          await addCategory(formData)
        }
      } else {
        if (subCategory) {
          await updateSubCategory(category.id, subCategory.id, formData)
        } else {
          await addSubCategory(category.id, formData)
        }
      }
      onClose()
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4" name={modalType === 'category' ? 'category-modal' : 'subcategory-modal'}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {modalType === 'category'
              ? category
                ? 'Kategori Düzenle'
                : 'Yeni Kategori'
              : subCategory
              ? 'Alt Kategori Düzenle'
              : 'Yeni Alt Kategori'}
          </h3>

          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                İsim
              </label>
              <input
                type="text"
                name={modalType === 'category' ? 'category-name' : 'subcategory-name'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Açıklama
              </label>
              <textarea
                name={modalType === 'category' ? 'category-description' : 'subcategory-description'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                İkon
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="text-2xl mr-2">{formData.icon}</span>
                  İkon Seç
                </button>
              </div>

              {showEmojiPicker && (
                <div className="mt-2 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, icon: emoji })
                          setShowEmojiPicker(false)
                        }}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                İptal
              </button>
              <button
                type="submit"
                name={modalType === 'category' ? 'save-category-button' : 'save-subcategory-button'}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {category || subCategory ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CategoryModal 