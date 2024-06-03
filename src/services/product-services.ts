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

export const handleAddToCartService = async ({
  user,
  productId,
}: {
  user: { username: string; email: string; id: string };
  productId: string;
}) => {
  try {
    await connectMongoDB();

    // Lấy thông tin người dùng
    const userInfo = await User.findById(user.id).populate({
      path: "cart.product",
      model: Product,
    });

    if (!userInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "User not found",
        error: "User not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Lấy thông tin sản phẩm
    const productInfo = await Product.findById(productId);

    if (!productInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Product not found",
        error: "Product not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const productInCart = userInfo.cart.find(
      (item) => item.product._id.toString() === productId
    );

    if (productInCart) {
      // Nếu sản phẩm đã có trong giỏ hàng, tăng số lượng sản phẩm lên
      productInCart.quantity += 1;
    } else {
      // Nếu sản phẩm chưa có trong giỏ hàng, thêm sản phẩm vào giỏ hàng
      userInfo.cart.push({ product: productInfo, quantity: 1 });
    }

    // Lưu lại thông tin người dùng
    await userInfo.save();

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Product added to cart successfully",
      data: userInfo.cart,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get list product in cart",
      error: "Failed to get list product in cart: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleEditProductService = async ({
  productId,
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
  productId: string;
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

    // Tìm product hiện tại
    const product = await Product.findById(productId);

    if (!product) {
      return {
        success: false,
        message: "Product not found",
        error: "Product not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Kiểm tra xem người dùng có phải là người bán sản phẩm không
    if (product.seller._id.toString() !== user.id) {
      return {
        success: false,
        message: "Unauthorized access",
        error: "You are not authorized to edit this product",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Cập nhật product
    product.name = name;
    product.description = description;
    product.price = price;
    product.productType = productType;
    product.stock = stock;
    product.images = imageUrls;

    if (discountRate > 0) {
      product.discountRate = discountRate;
      product.discountStartDate = discountStartDate;
      product.discountEndDate = discountEndDate;
    } else {
      product.discountRate = undefined;
      product.discountStartDate = undefined;
      product.discountEndDate = undefined;
      product.discountedPrice = undefined;
    }

    // Lưu product đã cập nhật
    await product.save();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Product updated successfully",
      data: product,
      statusCode: 200,
      type: "SUCCESS",
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to edit product",
      error: "Failed to edit product: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleDeleteProductService = async ({
  productId,
  user,
}: {
  productId: string;
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();
    // Tìm kiếm sản phẩm theo productId
    const product = await Product.findById(productId);

    if (!product) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Product not found",
        error: "Product not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Kiểm tra quyền sở hữu sản phẩm
    if (product.seller._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Unauthorized access",
        error: "You are not authorized to delete this product",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Xóa sản phẩm
    await Product.findByIdAndDelete(productId);

    // Trả về phản hồi thành công
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Product deleted successfully",
      data: null,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to delete product",
      error: "Failed to delete product: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
