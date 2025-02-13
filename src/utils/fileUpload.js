const path = require('path');
const fs = require('fs').promises;

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const fontDir = path.join(uploadsDir, 'fonts');
  const previewDir = path.join(uploadsDir, 'previews');

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(fontDir, { recursive: true });
    await fs.mkdir(previewDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error;
  }
};

const uploadFile = async (file) => {
  try {
    await createUploadsDir();

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    
    // Determine directory based on file type
    const isFont = /\.(ttf|otf|woff|woff2)$/i.test(fileExt);
    const uploadDir = isFont ? 'fonts' : 'previews';
    
    const filePath = path.join(__dirname, `../../uploads/${uploadDir}/${fileName}`);
    
    // Save file
    await fs.writeFile(filePath, file.buffer);
    
    // Return relative path for database storage
    return `uploads/${uploadDir}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

module.exports = {
  uploadFile
}; 