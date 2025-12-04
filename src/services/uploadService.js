import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Upload une ou plusieurs images au backend
 * @param {File[]} files - Fichiers à uploader
 * @returns {Promise<string[]>} URLs des images uploadées
 */
export async function uploadImages(files) {
  if (!files || files.length === 0) {
    return [];
  }

  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await axios.post(`${API_BASE_URL}/api/upload/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      return response.data.files.map(f => f.url);
    }

    throw new Error('Upload failed');
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Erreur d'upload: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Supprime une image uploadée
 * @param {string} filename - Nom du fichier à supprimer
 */
export async function deleteImage(filename) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/upload/images/${filename}`);
    return response.data;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Erreur de suppression: ${error.response?.data?.error || error.message}`);
  }
}
