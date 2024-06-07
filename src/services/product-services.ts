import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import { ErrorResponse, ProductType, SuccessResponse } from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import Product from "../models/product";
import User from "../models/user";
import Order from "../models/order";
import { pusherServer } from "../utils/pusher";
import Notification from "../models/notification";
import {
  generateOrderCancelledMail,
  generateOrderDeliveredMail,
} from "../utils/mailgenerate";
import { sendEmail } from "../utils/mailer";

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
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Sản phẩm đã có trong giỏ hàng rồi",
        error: "Sản phẩm đã tồn tại trong giỏ hàng",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
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
      message: "Failed to add product in cart",
      error: "Failed to add product in cart: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleDeleteCartService = async ({
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

    // Kiểm tra xem sản phẩm có tồn tại trong giỏ hàng không
    const cartItemIndex = userInfo.cart.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (cartItemIndex === -1) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Product not found in cart",
        error: "Product not found in cart",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Xóa sản phẩm khỏi giỏ hàng
    userInfo.cart.splice(cartItemIndex, 1);
    await userInfo.save();

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Product removed from cart successfully",
      data: userInfo.cart,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to delete product in cart",
      error: "Failed to delete product in cart: " + error.message,
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

export const handleGetPurchasedOrderService = async ({
  user,
}: {
  user: { username: string; email: string; id: string };
}) => {
  try {
    await connectMongoDB();

    const orders = await Order.find({
      buyer: user.id,
      status: { $ne: "pending" },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "products.product",
        model: "Product",
      })
      .populate({
        path: "seller",
        model: "User",
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get purchased orders successfully",
      data: orders,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get purchased order",
      error: "Failed to get purchased order: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetMyOrderService = async ({
  user,
}: {
  user: { username: string; email: string; id: string };
}) => {
  try {
    await connectMongoDB();

    const orders = await Order.find({
      seller: user.id,
      status: { $ne: "pending" },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "products.product",
        model: Product,
      })
      .populate({
        path: "seller",
        model: User,
        select: "username email profileImage",
      })
      .populate({
        path: "buyer",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get orders successfully",
      data: orders,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get order",
      error: "Failed to get order: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleSetOrderService = async ({
  user,
  orderId,
  status,
}: {
  user: { username: string; email: string; id: string };
  orderId: string;
  status: "processed" | "shipped" | "delivered" | "cancelled" | "success";
}) => {
  try {
    await connectMongoDB();

    const order = await Order.findById(orderId)
      .populate({
        path: "seller",
        model: User,
        select: "username email profileImage",
      })
      .populate({
        path: "buyer",
        model: User,
        select: "username email profileImage",
      })
      .populate({
        path: "products.product",
        model: Product,
      })
      .exec();

    if (!order) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Order not found",
        error: "Order not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra quyền */
    if (order.seller._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "You are not authorized to update this order",
        error: "Unauthorized",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra tình trạng đơn hàng xem đã thành công hoặc từ chối thì không được đổi */
    if (order.status === "pending") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "You are not authorized to update this order",
        error: "Unauthorized",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    if (order.status === "cancelled" || order.status === "success") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "You can not update this order",
        error: "You can not update this order",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Lưu trạng thái đơn hàng */
    order.status = status;
    await order.save();

    /** Tạo và lưu Notification */
    const buyerNotification = new Notification({
      receiver: order.buyer._id.toString(),
      status: "unseen",
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      subtitle: `Your order #${order.orderCode} has been ${status}.`,
      content: `Your order has been successfully ${status} and is now being processed.`,
      moreInfo: `/store/purchased-order`,
    });

    await buyerNotification.save();

    // Gửi thông báo thời gian thực cho người mua
    await pusherServer.trigger(
      `user-${order.buyer._id.toString()}-notifications`,
      "new-notification",
      buyerNotification
    );

    // Gửi email
    let emailBody;
    if (status === "delivered") {
      emailBody = generateOrderDeliveredMail(
        order.buyer.username,
        order.orderCode,
        order.products.map((product) => ({
          name: product.product.name,
          quantity: product.quantity,
          price: product.product.price,
        }))
      );
    } else if (status === "cancelled") {
      emailBody = generateOrderCancelledMail(
        order.buyer.username,
        order.orderCode
      );
    }

    if (emailBody) {
      const subject =
        status === "delivered" ? "Order Delivered" : "Order Cancelled";
      await sendEmail(order.buyer.email, subject, emailBody);
    }

    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Order status updated successfully",
      data: order,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed when set status of order",
      error: "Failed when set status of order: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
