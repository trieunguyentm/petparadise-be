import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import { ErrorResponse, ProductType, SuccessResponse } from "../types";
import { ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import Product from "../models/product";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "product" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Upload failed without a specific error."));
        } else {
          resolve(result.url); // Khi upload thành công, trả về URL của ảnh
        }
      }
    );

    // Tạo một stream từ buffer của file và pipe nó vào stream upload của Cloudinary
    const bufferStream = new Stream.PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(uploadStream);
  });
};

export const handleCreateProductService = async ({
  user,
  name,
  description,
  productType,
  price,
  discountRate,
  discountStartDate,
  discountEndDate,
  stock,
  images,
}: {
  user: { id: string; username: string; email: string };
  name: string;
  description: string;
  productType: ProductType;
  price: number;
  discountRate: number;
  discountStartDate: Date;
  discountEndDate: Date;
  stock: number;
  images: Express.Multer.File[];
}) => {
  try {
    /** Upload các ảnh lên Cloudinary */
    const imageUrls = await Promise.all(
      images.map((image) => uploadImage(image))
    );

    await connectMongoDB();

    let dataCreate: any = {
      seller: user.id,
      name,
      description,
      price,
      images: imageUrls,
      productType,
      stock,
    };

    if (discountRate > 0) {
      dataCreate = {
        ...dataCreate,
        discountRate,
        discountStartDate,
        discountEndDate,
      };
    }

    // Tạo product mới
    const newProduct = await Product.create(dataCreate);

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Post created successfully",
      data: newProduct,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create product",
      error: "Failed to create product: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
