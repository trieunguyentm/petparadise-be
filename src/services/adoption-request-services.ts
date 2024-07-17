import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import { ErrorResponse, SuccessResponse } from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import AdoptionRequest from "../models/adoption-request";
import PetAdoptionPost from "../models/pet-adoption-post";
import Notification from "../models/notification";
import { pusherServer } from "../utils/pusher";
import User from "../models/user";
import { generateAdoptionResponseMail } from "../utils/mailgenerate";
import { sendEmail } from "../utils/mailer";
import TransferContract from "../models/transfer-contract";
import { checkBadWords } from "../utils/check-bad-word";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "adoption-request" },
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

export const handleCreateAdoptionRequestService = async ({
  user,
  files,
  petAdoptionPost,
  descriptionForPet,
  descriptionForUser,
  type,
  contactInfo,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[] | undefined;
  petAdoptionPost: string;
  descriptionForPet: string;
  descriptionForUser: string;
  type: string;
  contactInfo: string;
}) => {
  try {
    // Kiểm tra nội dung nhạy cảm
    if (
      checkBadWords(descriptionForPet) === false ||
      checkBadWords(descriptionForUser) === false ||
      checkBadWords(contactInfo) === false
    ) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Nội dung có chứa từ ngữ nhạy cảm",
        error: "Nội dung có chứa từ ngữ nhạy cảm",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Upload image */
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await Promise.all(files.map((file) => uploadImage(file)));
    }

    await connectMongoDB();

    const postInfo = await PetAdoptionPost.findById(petAdoptionPost);
    if (!postInfo) {
      return {
        success: false,
        message: "Không tìm thấy bài viết nhận thú cưng",
        error: "Không tìm thấy bài viết nhận thú cưng",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    if (user.id === postInfo.poster._id.toString()) {
      return {
        success: false,
        message: "Không thể yêu cầu bởi vì bạn chính là người đăng",
        error: "Không thể yêu cầu bởi vì bạn chính là người đăng",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Kiểm tra xem yêu cầu đã tồn tại chưa
    const existingRequest = await AdoptionRequest.findOne({
      requester: user.id,
      petAdoptionPost: petAdoptionPost,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return {
        success: false,
        message: "Bạn đã gửi yêu cầu nhận thú cưng này rồi",
        error: "Bạn đã gửi yêu cầu nhận thú cưng này rồi",
        statusCode: 400,
        type: ERROR_SERVER,
      } as ErrorResponse;
    }

    let dateCreate: any = {
      requester: user.id,
      petAdoptionPost,
      descriptionForPet,
      descriptionForUser,
      contactInfo,
      type,
      status: "pending",
      images: imageUrls,
    };

    // Tạo yêu cầu nhận nuôi
    const newRequest = await AdoptionRequest.create(dateCreate);

    postInfo.adoptionRequests.push(newRequest);
    await postInfo.save();

    // Notification
    const notification = new Notification({
      receiver: postInfo.poster._id.toString(),
      status: "unseen",
      title: "Yêu cầu mới về việc nhận thú cưng",
      subtitle: `${user.username} đã yêu cầu nhận thú cưng`,
      moreInfo: `/pet-adoption/request/${petAdoptionPost}`,
    });

    await notification.save();

    // Pusher: Send the notification
    await pusherServer.trigger(
      `user-${postInfo.poster._id.toString()}-notifications`,
      `new-notification`,
      notification
    );

    // Return
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Tạo yêu cầu nhận thú cưng thành công",
      data: newRequest,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo yêu cầu nhận thú cưng",
      error: "Xảy ra lỗi khi tạo yêu cầu nhận thú cưng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetAdoptionRequestByPostService = async ({
  user,
  postId,
  limit,
  offset,
}: {
  user: { id: string; username: string; email: string };
  postId: string;
  offset: number;
  limit: number;
}) => {
  try {
    await connectMongoDB();

    // Tìm bài đăng nhận nuôi thú cưng theo postId
    const post = await PetAdoptionPost.findById(postId)
      .populate("poster")
      .select("-password")
      .exec();

    if (!post) {
      return {
        success: false,
        message: "Không tìm thấy bài viết nhận thú cưng",
        error: "Không tìm thấy bài viết nhận thú cưng",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    // Kiểm tra quyền của user
    if (post.poster._id.toString() !== user.id) {
      return {
        success: false,
        message: "Không có quyền truy cập",
        error: "Không có quyền truy cập",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Lấy các yêu cầu nhận nuôi với phân trang
    const adoptionRequests = await AdoptionRequest.find({
      petAdoptionPost: postId,
    })
      .populate({
        path: "requester",
        model: User,
        select: "username email profileImage",
      })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const totalRequests = await AdoptionRequest.countDocuments({
      petAdoptionPost: postId,
    });

    // Trả về danh sách adoption requests của bài đăng với thông tin phân trang
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy các yêu cầu nhận thú cưng thành công",
      data: {
        adoptionRequests,
        totalRequests,
      },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách yêu cầu nhận thú cưng",
      error:
        "Xảy ra lỗi khi lấy danh sách yêu cầu nhận thú cưng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleSetAdoptionRequestService = async ({
  user,
  requestId,
  status,
}: {
  user: { username: string; email: string; id: string };
  requestId: string;
  status: "approved" | "rejected";
}) => {
  try {
    await connectMongoDB();
    /** Lấy ra request và kiểm tra tồn tại */
    const request = await AdoptionRequest.findById(requestId)
      .populate({
        path: "petAdoptionPost",
        model: PetAdoptionPost,
        select: "-likes -comments -adoptionRequests",
      })
      .populate({
        path: "requester",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    if (!request) {
      return {
        success: false,
        message: "Không tìm thấy yêu cầu này",
        error: "Không tìm thấy yêu cầu này",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    const petAdoptionPost = request.petAdoptionPost;

    /** Kiểm tra quyền thực hiện */
    if (petAdoptionPost.poster.toString() !== user.id) {
      return {
        success: false,
        message: "Không có quyền truy cập",
        error: "Không có quyền truy cập",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    /** Nếu chuyển từ "approved" sang "rejected" */
    if (request.status === "approved" && status === "rejected") {
      petAdoptionPost.status = "available";
      await petAdoptionPost.save();

      // Xóa hợp đồng nếu có
      await TransferContract.deleteOne({ adoptionRequest: request._id });
    }

    /** Nếu đồng ý */
    if (status === "approved") {
      // Kiểm tra nếu đã có yêu cầu nào được đồng ý trước đó
      const existingApprovedRequest = await AdoptionRequest.findOne({
        petAdoptionPost: petAdoptionPost._id,
        status: "approved",
      }).populate({
        path: "requester",
        model: User,
        select: "username email profileImage",
      });

      if (existingApprovedRequest) {
        existingApprovedRequest.status = "rejected";
        await existingApprovedRequest.save();
        await TransferContract.deleteOne({
          adoptionRequest: existingApprovedRequest._id,
        });
        await pusherServer.trigger(
          `adopt-pet-${petAdoptionPost._id.toString()}`,
          `new-status`,
          existingApprovedRequest
        );
      }

      // Cập nhật trạng thái bài đăng nhận nuôi thú cưng
      petAdoptionPost.status = "adopted";
      await petAdoptionPost.save();

      // Tạo hợp đồng giao dịch mới
      const transferContract = new TransferContract({
        petAdoptionPost: petAdoptionPost._id,
        adoptionRequest: request._id,
        giver: petAdoptionPost.poster,
        receiver: request.requester,
      });

      await transferContract.save();
    }

    // Cập nhật trạng thái của request
    request.status = status;
    await request.save();

    // Pusher
    await pusherServer.trigger(
      `adopt-pet-${petAdoptionPost._id.toString()}`,
      `new-status`,
      request
    );

    // Notification
    const notification = new Notification({
      receiver: request.requester._id,
      status: "unseen",
      title: "Phản hồi về việc nhận thú cưng",
      subtitle: `${user.username} đã ${
        status === "approved" ? "chấp nhận" : "từ chối"
      } yêu cầu của bạn`,
      moreInfo: `/pet-adoption/request/${petAdoptionPost._id.toString()}`,
    });

    // Send email
    const typePet = {
      dog: "Chó",
      cat: "Mèo",
      bird: "Chim",
      rabbit: "Thỏ",
      fish: "Cá",
      rodents: "Loài gặm nhấm",
      reptile: "Loài bò sát",
      other: "Khác",
    };

    if (status === "approved") {
      const emailBody = generateAdoptionResponseMail(
        request.requester.email,
        status,
        petAdoptionPost._id.toString(),
        petAdoptionPost.petName || "Chưa cung cấp",
        typePet[petAdoptionPost.petType],
        petAdoptionPost.contactInfo
      );
      const subject = "Thông báo về yêu cầu nhận nuôi thú cưng";
      await sendEmail(request.requester.email, subject, emailBody);
    }

    await notification.save();
    // Pusher: Send the notification
    await pusherServer.trigger(
      `user-${request.requester._id.toString()}-notifications`,
      `new-notification`,
      notification
    );

    const dataResponse: SuccessResponse = {
      success: true,
      message: `${
        status === "approved" ? "Chấp nhận" : "Từ chối"
      } yêu cầu nhận thú cưng thành công`,
      data: request,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: `Lỗi xảy ra khi ${
        status === "approved" ? "chấp nhận" : "từ chối"
      } yêu cầu nhận thú cưng`,
      error:
        `Lỗi xảy ra khi ${
          status === "approved" ? "chấp nhận" : "từ chối"
        } yêu cầu nhận thú cưng: ` + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
