import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import {
  ErrorResponse,
  GenderPet,
  ReasonFindOwner,
  SizePet,
  StatusPetAdoption,
  SuccessResponse,
  TypePet,
} from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import PetAdoptionPost from "../models/pet-adoption-post";
import User from "../models/user";
import PetAdoptionCommentModel from "../models/pet-adoption-comment";
import { pusherServer } from "../utils/pusher";
import Notification from "../models/notification";
import notificationQueue from "../workers/notification-queue";
import { error } from "console";
import TransferContract from "../models/transfer-contract";
import { checkBadWords } from "../utils/check-bad-word";

// Helper function to escape regex characters
function escapeRegex(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "image_find_owner_pet" },
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

export const handleCreatePetAdoptionPostService = async ({
  user,
  files,
  typePet,
  reason,
  genderPet,
  location,
  description,
  healthInfo,
  contactInfo,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[];
  typePet: TypePet;
  reason: ReasonFindOwner;
  genderPet: GenderPet;
  location: string;
  description: string;
  healthInfo: string;
  contactInfo: string;
}) => {
  try {
    // Kiểm tra nội dung nhạy cảm
    if (
      checkBadWords(description) === false ||
      checkBadWords(healthInfo) === false ||
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
    // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
    const imageUrls = await Promise.all(files.map((file) => uploadImage(file)));

    await connectMongoDB();

    let dataCreate: any = {
      poster: user.id,
      petType: typePet,
      healthInfo,
      description,
      location,
      contactInfo,
      reason,
      images: imageUrls,
    };
    if (genderPet) dataCreate = { ...dataCreate, gender: genderPet };

    // Tạo bài đăng tìm chủ nhân cho thú cưng
    const newPetAdoptionPost = await PetAdoptionPost.create(dataCreate);

    const userInfo = await User.findById(user.id);
    userInfo?.petAdoptionPosts.push(newPetAdoptionPost);
    await userInfo?.save();

    // Thêm nhiệm vụ gửi thông báo vào hàng đợi
    await notificationQueue.add({
      type: "PET_ADOPTION",
      data: {
        location,
        typePet,
        user,
        newPetAdoptionPost,
      },
    });

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Tạo bài viết thành công",
      data: newPetAdoptionPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo bài viết tìm chủ nhân cho thú cưng",
      error:
        "Xảy ra lỗi khi tạo bài viết tìm chủ nhân cho thú cưng: " +
        error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetPetAdoptionPostService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    const petAdoptionPosts = await PetAdoptionPost.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .exec();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin bài viết tìm chủ nhân cho thú cưng thành công",
      data: petAdoptionPosts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy bài đăng tìm chủ nhân cho thú cưng",
      error:
        "Xảy ra lỗi khi lấy bài đăng tìm chủ nhân cho thú cưng: " +
        error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetPetAdoptionPostByIdService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();
    const petAdoptionPost = await PetAdoptionPost.findById(postId)
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin bài viết tìm chủ nhân cho thú cưng thành công",
      data: petAdoptionPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tải bài viết",
      error: "Xảy ra lỗi khi tải bài viết: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleAddCommentService = async ({
  user,
  postId,
  content,
  files,
}: {
  user: { id: string; username: string; email: string };
  postId: string;
  content: string;
  files: Express.Multer.File[] | undefined;
}) => {
  try {
    await connectMongoDB();
    const [userInfo, postInfo] = await Promise.all([
      User.findById(user.id).select("-password"),
      PetAdoptionPost.findById(postId),
    ]);
    if (!userInfo || !postInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy người dùng hoặc bài viết",
        error: "Không tìm thấy người dùng hoặc bài viết",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
      let imageUrls: string[] = [];
      if (files) {
        imageUrls = await Promise.all(files.map((file) => uploadImage(file)));
      }
      // Tạo comment
      const newComment = await PetAdoptionCommentModel.create({
        poster: userInfo._id,
        images: imageUrls,
        content: content,
        post: postInfo._id,
      });
      await newComment.populate("poster", "username profileImage");

      // Thêm comment này vào post
      postInfo.comments.push(newComment._id);
      await postInfo.save();

      // Pusher
      await pusherServer.trigger(
        `pet-adoption-post-${postId}-comments`,
        `new-comment`,
        newComment
      );
      // Nếu người cmt khác với người đăng bài thì tạo notification
      if (user.id !== postInfo.poster._id.toString()) {
        // Notification
        const notification = new Notification({
          receiver: postInfo.poster._id,
          status: "unseen",
          title: "Bình luận mới",
          subtitle: `${user.username} đã bình luận trong bài viết tìm chủ nhân cho thú cưng của bạn`,
          moreInfo: `/pet-adoption/${postId}`,
        });

        await notification.save();

        // Pusher: Send the notification
        await pusherServer.trigger(
          `user-${postInfo.poster._id.toString()}-notifications`,
          `new-notification`,
          notification
        );
      }
      /** Return */
      const dataResponse: SuccessResponse = {
        success: true,
        message: "Tạo bình luận thành công",
        data: newComment,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi thêm bình luận",
      error: "Xảy ra lỗi khi thêm bình luận: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetCommentByPostService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();

    const comments = await PetAdoptionCommentModel.find({
      post: postId,
    })
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .sort({ createdAt: -1 })
      .exec();

    // Return the comments
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy danh sách bình luận thành công",
      data: comments,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách bình luận",
      error: "Xảy ra lỗi khi lấy danh sách bình luận: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleDeletePetAdoptionPostByIdService = async ({
  postId,
  user,
}: {
  postId: string;
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();
    // Find the post by ID
    const post = await PetAdoptionPost.findById(postId);
    if (!post) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy bài viết",
        error: "Không tìm thấy bài viết",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if the user is the owner of the post
    if (post.poster.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Delete the post
    await PetAdoptionPost.findByIdAndDelete(postId);
    // Remove the post reference from the user's petAdoptionPosts array
    await User.updateOne(
      { _id: user.id },
      { $pull: { petAdoptionPosts: postId } }
    );
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Xóa bài viết thành công",
      data: "Xóa bài viết thành công",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xóa bài viết",
      error: "Xảy ra lỗi khi xóa bài viết: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetPetAdoptionPostBySearchService = async ({
  petType,
  gender,
  size,
  location,
  status,
  reason,
  limit,
  offset,
}: {
  petType: "all" | TypePet;
  gender: "all" | GenderPet;
  size: "all" | SizePet;
  location: string;
  status: "all" | StatusPetAdoption;
  reason: "all" | ReasonFindOwner;
  limit: number;
  offset: number;
}) => {
  let query: any = {};

  if (petType !== "all") query.petType = petType;
  if (gender !== "all") query.gender = gender;
  if (size !== "all") query.sizePet = size;
  const [cityName, districtName, wardName] = location.split("-");

  if (cityName) {
    query.location = new RegExp("^" + escapeRegex(cityName), "i");
    if (districtName) {
      query.location = new RegExp(
        "^" + escapeRegex(`${cityName}-${districtName}`),
        "i"
      );
      if (wardName) {
        query.location = new RegExp(
          "^" + escapeRegex(`${cityName}-${districtName}-${wardName}`),
          "i"
        );
      }
    }
  }

  if (status !== "all") query.status = status;
  if (reason !== "all") query.reason = reason;
  try {
    await connectMongoDB();
    const posts = await PetAdoptionPost.find(query)
      .skip(offset)
      .limit(limit)
      .populate("poster", "username profileImage")
      .sort({ createdAt: -1 })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin bài viết thành công",
      data: posts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy bài đăng tìm chủ nhân cho thú cưng",
      error:
        "Xảy ra lỗi khi lấy bài đăng tìm chủ nhân cho thú cưng: " +
        error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetAdoptedPetOwnerService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();
    // Lấy ra thông tin của pet adoption post
    const petAdoptionPost = await PetAdoptionPost.findById(postId).populate({
      path: "adoptionRequests",
      match: { status: "approved" },
      populate: {
        path: "requester",
        select: "username email profileImage",
      },
    });

    if (!petAdoptionPost) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy bài viết nhận thú cưng",
        error: "Không tìm thấy bài viết nhận thú cưng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    if (petAdoptionPost.status !== "adopted") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Thú cưng này vẫn chưa được nhận nuôi",
        error: "Thú cưng này vẫn chưa được nhận nuôi",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Lấy yêu cầu nhận nuôi được chấp nhận
    const approvedRequest = petAdoptionPost.adoptionRequests.find(
      (request: any) => request.status === "approved"
    );

    if (!approvedRequest) {
      return {
        success: false,
        message: "Không tìm thấy yêu cầu nhận thú cưng đã được phê duyệt",
        error: "Không tìm thấy yêu cầu nhận thú cưng đã được phê duyệt",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Lấy thông tin người nhận nuôi
    const adopter = approvedRequest.requester;

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin người nhận nuôi thú cưng thành công",
      data: {
        adopter: {
          _id: adopter._id.toString(),
          username: adopter.username,
          email: adopter.email,
          profileImage: adopter.profileImage,
        },
      },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy thông tin người nhận nuôi thú cưng",
      error:
        "Xảy ra lỗi khi lấy thông tin người nhận nuôi thú cưng: " +
        error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetConfirmByPostService = async ({
  user,
  postId,
}: {
  user: { id: string; username: string; email: string };
  postId: string;
}) => {
  try {
    await connectMongoDB();

    const contract = await TransferContract.findOne({ petAdoptionPost: postId })
      .populate("giver", "username email profileImage")
      .populate("receiver", "username email profileImage")
      .exec();

    if (!contract) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy hợp đồng giao dịch thú cưng",
        error: "Không tìm thấy hợp đồng giao dịch thú cưng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Nếu user.id không phải chủ post hoặc người nhận pet
    if (
      user.id !== contract.giver._id.toString() &&
      user.id !== contract.receiver._id.toString()
    ) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin giao dịch thú cưng thành công",
      data: contract,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy thông tin giao dịch",
      error: "Xảy ra lỗi khi lấy thông tin giao dịch: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleConfirmAdoptPetService = async ({
  user,
  postId,
  confirmed,
}: {
  user: { id: string; username: string; email: string };
  postId: string;
  confirmed: boolean;
}) => {
  try {
    await connectMongoDB();

    const contract = await TransferContract.findOne({
      petAdoptionPost: postId,
    })
      .populate({
        path: "petAdoptionPost",
        model: PetAdoptionPost,
      })
      .populate({
        path: "giver",
        model: User,
        select: "username email profileImage",
      })
      .populate({
        path: "receiver",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    if (!contract) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy hợp đồng giao dịch thú cưng",
        error: "Không tìm thấy hợp đồng giao dịch thú cưng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Nếu user.id không phải chủ post hoặc người nhận pet
    if (
      user.id !== contract.giver._id.toString() &&
      user.id !== contract.receiver._id.toString()
    ) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Nếu là người nhận xác nhận
    if (user.id.toString() === contract.receiver._id.toString()) {
      // Nếu đã xác nhận trước đó rồi
      if (contract.receiverConfirmed) {
        let dataResponse: ErrorResponse = {
          success: false,
          message: "Không thể cập nhật hợp đồng vì nó đã được xác nhận",
          error: "Không thể cập nhật hợp đồng vì nó đã được xác nhận",
          statusCode: 403,
          type: ERROR_CLIENT,
        };
        return dataResponse;
      }
      contract.receiverConfirmed = confirmed;
      await contract.save();
      // Tạo notification
      const notification = new Notification({
        receiver: contract.giver._id,
        status: "unseen",
        title: "Xác nhận nhận nuôi thú cưng",
        subtitle: `${user.username} đã ${
          confirmed ? "đồng ý" : "từ chối"
        } nhận nuôi thú cưng`,
        moreInfo: `/pet-adoption/confirm/${postId}`,
      });
      await notification.save();
      await pusherServer.trigger(
        `user-${contract.giver._id.toString()}-notifications`,
        `new-notification`,
        notification
      );
      // Nếu người nhận không dồng ý
      if (!confirmed) {
        contract.status = "cancelled";
        contract.petAdoptionPost.status = "available";
        await contract.save();
        await contract.petAdoptionPost.save();
      }
      let dataResponse: SuccessResponse = {
        success: true,
        message: `Bạn đã ${confirmed ? "đồng ý" : "từ chối"} nhận nuôi`,
        data: contract,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
    // Nếu là người gửi xác nhận
    else {
      // Nếu người nhận chưa xác nhận
      if (!contract.receiverConfirmed) {
        let dataResponse: ErrorResponse = {
          success: false,
          message: `${contract.receiver.username} vẫn chưa xác nhận đồng ý nuôi`,
          error: `Bạn chưa thể xác nhận vì ${contract.receiver.username} chưa xác nhận đồng ý nuôi`,
          statusCode: 400,
          type: ERROR_CLIENT,
        };
        return dataResponse;
      }
      // Nếu đã xác nhận trước đó rồi
      if (contract.giverConfirmed) {
        let dataResponse: ErrorResponse = {
          success: false,
          message: "Không thể cập nhật hợp đồng vì nó đã được xác nhận",
          error: "Không thể cập nhật hợp đồng vì nó đã được xác nhận",
          statusCode: 403,
          type: ERROR_CLIENT,
        };
        return dataResponse;
      }
      // Nếu người nhận đã xác nhận
      contract.giverConfirmed = true;
      contract.status = "confirmed";
      await contract.save();
      // Schedule quarterly reminders
      await notificationQueue.add(
        {
          type: "ADOPTION_REMINDER",
          data: {
            contractId: contract._id.toString(),
          },
        },
        { delay: 3 * 30 * 24 * 60 * 60 * 1000 } // 3 months delay
      );

      const dataResponse: SuccessResponse = {
        success: true,
        message: "Bạn đã xác nhận việc giao thú cưng",
        data: contract,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật trạng thái hợp đồng",
      error: "Xảy ra lỗi khi cập nhật trạng thái hợp đồng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
