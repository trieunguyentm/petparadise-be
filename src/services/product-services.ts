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
  generateNotificationCancelOrderMail,
  generateOrderCancelledMail,
  generateOrderDeliveredMail,
  generateOrderSuccessMail,
} from "../utils/mailgenerate";
import { sendEmail } from "../utils/mailer";
import orderQueue from "../workers/order-queue";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "product" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Tải ảnh không thành công"));
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
      message: "Tạo bài viết thành công",
      data: newProduct,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo sản phẩm",
      error: "Xảy ra lỗi khi tạo sản phẩm: " + error.message,
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
      message: "Lấy thông tin sản phẩm thành công",
      data: { total: products.length, products },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách sản phẩm",
      error: "Xảy ra lỗi khi lấy danh sách sản phẩm: " + error.message,
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
        message: "Không tìm thấy sản phẩm",
        error: "Không tìm thấy sản phẩm ",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin sản phẩm thành công",
      data: product,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy thông tin sản phẩm",
      error: "Xảy ra lỗi khi lấy thông tin sản phẩm: " + error.message,
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
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
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
        message: "Không tìm thấy sản phẩm",
        error: "Không tìm thấy sản phẩm",
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
      message: "Sản phẩm đã được thêm vào giỏ hàng thành công",
      data: userInfo.cart,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi thêm sản phẩm vào giỏ hàng",
      error: "Xảy ra lỗi khi thêm sản phẩm vào giỏ hàng: " + error.message,
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
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
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
        message: "Không tìm thấy sản phẩm trong giỏ hàng",
        error: "Không tìm thấy sản phẩm trong giỏ hàng",
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
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: userInfo.cart,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xóa sản phẩm trong giỏ hàng",
      error: "Xảy ra lỗi khi xóa sản phẩm trong giỏ hàng: " + error.message,
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
        message: "Không tìm thấy sản phẩm",
        error: "Không tìm thấy sản phẩm",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Kiểm tra xem người dùng có phải là người bán sản phẩm không
    if (product.seller._id.toString() !== user.id) {
      return {
        success: false,
        message: "Không có quyền truy cập",
        error: "Không có quyền truy cập",
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
      message: "Sản phẩm được cập nhật thành công",
      data: product,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi chỉnh sửa thông tin sản phẩm",
      error: "Xảy ra lỗi khi chỉnh sửa thông tin sản phẩm: " + error.message,
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
        message: "Không tìm thấy sản phẩm",
        error: "Không tìm thấy sản phẩm",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Kiểm tra quyền sở hữu sản phẩm
    if (product.seller._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không có quyền truy cập",
        error: "Không có quyền truy cập",
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
      message: "Xóa sản phẩm thành công",
      data: null,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xóa sản phẩm",
      error: "Xảy ra lỗi khi xóa sản phẩm: " + error.message,
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
      message: "Đã lấy các đơn hàng đã thanh toán",
      data: orders,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy các đơn hàng đã thanh toán",
      error: "Xảy ra lỗi khi lấy các đơn hàng đã thanh toán: " + error.message,
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
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách đơn hàng",
      error: "Xảy ra lỗi khi lấy danh sách đơn hàng: " + error.message,
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
  status: "processed" | "offline" | "shipped" | "delivered" | "cancelled";
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
        message: "Không tìm thấy đơn hàng",
        error: "Không tìm thấy đơn hàng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra quyền */
    if (order.seller._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra tình trạng đơn hàng đang pending thì không thể thay đổi */
    if (order.status === "pending") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra tình trạng đơn hàng xem đã thành công hoặc từ chối thì không được đổi */
    if (order.status === "cancelled" || order.status === "success") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể cập nhật trạng thái đơn hàng",
        error: "Không thể cập nhật trạng thái đơn hàng",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Nếu đơn hàng là offline thì chỉ chấp nhận việc hủy hoặc đã giao hàng hoặc đang giao hàng */
    if (
      order.typePayment === "offline" &&
      status !== "shipped" &&
      status !== "cancelled" &&
      status !== "delivered"
    ) {
      let dataResponse: ErrorResponse = {
        success: false,
        message:
          "Không thể cập nhật trạng thái đơn hàng offline thành trạng thái này",
        error:
          "Không thể cập nhật trạng thái đơn hàng offline thành trạng thái này",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    /** Lưu trạng thái đơn hàng */
    order.status = status;
    await order.save();

    if (status === "delivered") {
      const delay = 7 * 24 * 60 * 60 * 1000; // 7 ngày
      orderQueue.add({ type: "UPDATE_STATUS", data: { orderId } }, { delay });
    }

    const converStatusToText = {
      cancelled: "đã bị hủy",
      offline: "sẽ được thanh toán trực tiếp",
      processed: "đã được thanh toán",
      shipped: "đang được giao",
      delivered: "đã được giao tới",
    };

    /** Tạo và lưu Notification */
    const buyerNotification = new Notification({
      receiver: order.buyer._id.toString(),
      status: "unseen",
      title: `Đơn hàng ${converStatusToText[status]}`,
      subtitle: `Đơn hàng của bạn #${order.orderCode} ${converStatusToText[status]}.`,
      content: `Đơn hàng của bạn #${order.orderCode} ${converStatusToText[status]}.`,
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
        status === "delivered"
          ? "Đơn hàng đã được giao tới"
          : "Đơn hàng đã bị hủy";
      await sendEmail(order.buyer.email, subject, emailBody);
    }

    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật trạng thái đơn hàng",
      error: "Xảy ra lỗi khi cập nhật trạng thái đơn hàng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleConfirmOrderService = async ({
  user,
  typeConfirm,
  orderId,
}: {
  user: { username: string; email: string; id: string };
  typeConfirm: "cancel" | "accept";
  orderId: string;
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
        message: "Không tìm thấy đơn hàng",
        error: "Không tìm thấy đơn hàng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    if (order.status !== "delivered") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Đơn hàng chưa giao hàng tới",
        error: "Đơn hàng chưa giao hàng tới",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    if (order.buyer._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    let emailBody;
    if (typeConfirm === "accept") {
      order.status = "success";
      await order.save();

      // Nếu là thanh toán online thì cập nhật số dư
      if (order.typePayment === "online") {
        // Update the seller's account balance
        const seller = await User.findById(order.seller._id);
        if (!seller) {
          let dataResponse: ErrorResponse = {
            success: false,
            message: "Không tìm thấy người bán",
            error: "Không tìm thấy người bán",
            statusCode: 404,
            type: ERROR_CLIENT,
          };
          return dataResponse;
        }
        // Cập nhật số dư tài khoản của người bán
        seller.accountBalance =
          (seller.accountBalance || 0) + order.totalAmount;

        await seller.save();
      }

      // Gửi email thông báo đơn hàng thành công
      emailBody = generateOrderSuccessMail(
        order.buyer.username,
        order.orderCode,
        order.products.map((product) => ({
          name: product.product.name,
          quantity: product.quantity,
          price: product.product.price,
        }))
      );
      await sendEmail(order.buyer.email, "Đơn hàng thành công", emailBody);
    } else if (typeConfirm === "cancel") {
      if (order.typePayment === "online") {
        order.status = "processed";
      } else {
        order.status = "offline";
      }

      await order.save();

      // Gửi email thông báo cho người bán kiểm tra đơn hàng
      emailBody = generateNotificationCancelOrderMail(
        order.seller.username,
        order.orderCode,
        order.buyer.username,
        order.buyer.email,
        order.products.map((product) => ({
          name: product.product.name,
          quantity: product.quantity,
          price: product.product.price,
        }))
      );
      await sendEmail(
        order.seller.email,
        "Thông báo người mua từ chối đơn hàng",
        emailBody
      );
      // Tạo và lưu Notification
      const sellerNotification = new Notification({
        receiver: order.seller._id.toString(),
        status: "unseen",
        title: `Đơn hàng ${order.orderCode} đã bị từ chối`,
        subtitle: `Đơn hàng #${order.orderCode} đã được báo cáo là chưa nhận được sản phẩm.`,
        content: `Người mua đã báo cáo rằng họ chưa nhận được đơn đặt hàng. Vui lòng kiểm tra trạng thái đơn hàng và cập nhật cho phù hợp.`,
        moreInfo: `/store/manage-order`,
      });

      await sellerNotification.save();

      // Gửi thông báo thời gian thực cho người bán
      await pusherServer.trigger(
        `user-${order.seller._id.toString()}-notifications`,
        "new-notification",
        sellerNotification
      );
    }

    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      // message: `Order status updated to ${order.status} successfully`,
      message: "Cập nhật trạng thái thành công",
      data: order,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xác nhận đơn hàng",
      error: "Xảy ra lỗi khi xác nhận đơn hàng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
