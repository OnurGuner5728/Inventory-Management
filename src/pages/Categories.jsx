import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import CategoryModal from '../components/CategoryModal'


function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory } = useRealtime()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState(null)
  const [modalType, setModalType] = useState('category')
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(null)

  useEffect(() => {
    if (categories && categories.length >= 0) {
      setLoading(false)
    }
  }, [categories])

  // Realtime güncellemeleri dinle
  useEffect(() => {
    if (categories && categories.length > 0) {
      console.log('Realtime kategori güncellemesi:', categories)
    }
  }, [categories])

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setSelectedSubCategory(null)
    setModalType('category')
    setIsModalOpen(true)
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setSelectedSubCategory(null)
    setModalType('category')
    setIsModalOpen(true)
  }

  const handleAddSubCategory = (category) => {
    setSelectedCategory(category)
    setSelectedSubCategory(null)
    setModalType('subcategory')
    setIsModalOpen(true)
  }

  const handleEditSubCategory = (category, subCategory) => {
    setSelectedCategory(category)
    setSelectedSubCategory(subCategory)
    setModalType('subcategory')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
    setSelectedSubCategory(null)
  }

  const handleDeleteCategory = (category) => {
    setDeleteModal({ type: 'category', category })
  }

  const handleDeleteSubCategory = (category, subCategory) => {
    setDeleteModal({ type: 'subcategory', category, subCategory })
  }

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Kategoriler</h1>
        <button
          name="add-category-button"
          onClick={handleAddCategory}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Yeni Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white shadow rounded-lg overflow-hidden"
            name="category-div"
            data-category-name={category.name}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-indigo-600 hover:text-indigo-900"
                    name="edit-category-button"
                    data-category-name={category.name}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleAddSubCategory(category)}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200"
                    name="add-subcategory-button"
                    data-category-name={category.name}
                  >
                    Alt Kategori Ekle
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="text-red-600 hover:text-red-900"
                    name="delete-category-button" 
                    data-category-name={category.name}
                  >
                    Sil
                  </button>
                </div>
              </div>

              {/* Alt Kategoriler */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Alt Kategoriler
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.sub_categories?.map((subCategory) => (
                    <div
                      key={subCategory.id}
                      className="bg-gray-50 rounded-md p-4"
                      name="subcategory-div"
                      data-subcategory-name={subCategory.name}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{subCategory.icon}</span>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">
                              {subCategory.name}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {subCategory.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditSubCategory(category, subCategory)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                            name="edit-subcategory-button"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteSubCategory(category, subCategory)}
                            className="text-red-600 hover:text-red-900 text-sm"
                            name="delete-subcategory-button"
                            data-subcategory-name={subCategory.name}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={selectedCategory}
        subCategory={selectedSubCategory}
        modalType={modalType}
      />

      {deleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4" name="delete-modal">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {deleteModal.type === 'category' ? 'Kategori Sil' : 'Alt Kategori Sil'}
            </h3>
            <p className="mb-4">Silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end space-x-3">
              <button
                name="cancel-delete-button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDeleteModal(null)}
              >
                İptal
              </button>
              <button
                name="confirm-delete-button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={async () => {
                  if (deleteModal.type === 'category') {
                    try {
                      await deleteCategory(deleteModal.category.id)
                 
                    } catch (error) {
                  
                    }
                  } else if (deleteModal.type === 'subcategory') {
                    try {
                      await deleteSubCategory(deleteModal.category.id, deleteModal.subCategory.id)
                     
                    } catch (error) {
                     
                    }
                  }
                  setDeleteModal(null)
                }}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories 