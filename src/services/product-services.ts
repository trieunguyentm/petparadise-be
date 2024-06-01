import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import { ErrorResponse, ProductType, SuccessResponse } from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import Product from "../models/product";
import User from "../models/user";

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

const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

export const handleGetProductService = async ({
  offset,
  limit,
  productType,
  minPrice,
  maxPrice,
  name,
  seller,
}: {
  offset: number;
  limit: number;
  productType: ProductType | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  name: string | undefined;
  seller: string | undefined;
}) => {
  try {
    // Tạo bộ lọc tìm kiếm
    const filter: any = {};

    if (productType) filter.productType = productType;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (name) {
      const normalizedSearch = normalizeString(name as string);
      filter.$expr = {
        $regexMatch: {
          input: { $toLower: "$name" },
          regex: new RegExp(normalizedSearch, "i"),
        },
      };
    }
    if (seller) filter.seller = seller;
    await connectMongoDB();

    // Lấy danh sách sản phẩm
    const products = await Product.find(filter)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "seller",
        model: User,
        select: "username emaill profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get product successfully",
      data: { total: products.length, products },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get list product",
      error: "Failed to get list product: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetProductByIdService = async ({
  productId,
}: {
  productId: string;
}) => {
  try {
    await connectMongoDB();

    const product = await Product.findById(productId).populate({
      path: "seller",
      model: User,
      select: "username email profileImage",
    });

    if (!product) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Product not found",
        error: "Product not found ",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get product successfully",
      data: product,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get this product",
      error: "Failed to get product: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
