import { body, param, query } from "express-validator";

export const changePasswordValidator = [
  body("currentPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu hiện tại không hợp lệ")
    .notEmpty()
    .withMessage("Chưa cung cấp mật khẩu hiện tại"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới không hợp lệ")
    .notEmpty()
    .withMessage("Chưa cung cấp mật khẩu mới"),
];

export const updateUserValidator = [
  body("location")
    .optional() // Make location optional
    .isString()
    .withMessage("Chưa cung cấp vị trí")
    .custom((value) => {
      // Check if the value matches the pattern "city-district-ward"
      const locationPattern = /^[^\s].*-[^\s].*-[^\s].*$/;
      if (!locationPattern.test(value)) {
        throw new Error(
          "Vị trí người dùng cần có định dạng 'city-district-ward'"
        );
      }
      return true;
    }),
  body("typePet")
    .optional() // Make typePet optional
    .isArray()
    .withMessage("Loại thú cưng yêu thích cần có dạng mảng")
    .custom((value) => {
      const allowedValues = [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "fish",
        "rodents",
        "reptile",
        "other",
      ];
      const isValid = value.every((pet: string) => allowedValues.includes(pet));
      if (!isValid) {
        throw new Error("Loại thú cưng cần là một mảng với các giá trị hợp lệ");
      }
      return true;
    }),
];

export const seenNotificationValidator = [
  param("notificationId").notEmpty().withMessage("ID thông báo không hợp lệ"),
];

export const likePostValidator = [
  body("postID").notEmpty().withMessage("ID của bài viết không hợp lệ"),
];

export const savePostValidator = [
  body("postID").notEmpty().withMessage("ID của bài viết không hợp lệ"),
];

export const followValidator = [
  body("peopleID").notEmpty().withMessage("ID người dùng không hợp lệ"),
];

export const searchValidator = [
  query("query").notEmpty().withMessage("Truy vấn tìm kiếm không hợp lệ"),
];

export const addFavoriteProductValidator = [
  param("productId").notEmpty().withMessage("ID của sản phẩm không hợp lệ"),
];

export const getDetailInfoValidator = [
  param("username").notEmpty().withMessage("Tên người dùng không hợp lệ"),
];

export const createReportValidator = [
  body("description").notEmpty().withMessage("Chưa cung cấp mô tả vi phạm"),
  body("link")
    .notEmpty()
    .withMessage("Chưa cung cấp đường dẫn nội dung vi phạm"),
];

export const createRequestDrawMoneyValidator = [
  body("amount").isNumeric().withMessage("Số tiền không hợp lệ"),
  body("bankCode")
    .notEmpty()
    .withMessage("Chưa cấp cung codeName của ngân hàng"),
  body("accountNumber").notEmpty().withMessage("Chưa cấp cấp số tài khoản"),
  body("accountName").notEmpty().withMessage("Chưa cung cấp tên chủ tài khoản"),
];
