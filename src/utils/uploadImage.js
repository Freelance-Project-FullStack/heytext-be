const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

cloudinary.config({
  cloud_name: "drd2uj0cy",
  api_key: "594382986378214",
  api_secret: "DtzkGIoFpdTDw31BK1mqCc3iCis",
});

const uploadImage = async (file) => {
  try {
    // Upload file lên Cloudinary sử dụng Promise
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file,
        {
          public_id: `image_${uuidv4()}`,
          folder: "samples", // Tạo ID ngẫu nhiên cho ảnh
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        }
      );
    });

    // Trả về thông tin sau khi upload thành công
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Error uploading image");
  }
};

// uploadImage(); // Test upload image

module.exports = { uploadImage };
