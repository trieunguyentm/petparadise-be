import { body, param, query } from "express-validator";

export const createPetAdoptioPostValidator = [
  body("typePet")
    .isIn([
      "dog",
      "cat",
      "bird",
      "rabbit",
      "fish",
      "rodents",
      "reptile",
      "other",
    ])
    .withMessage("Kiểu thú cưng không hợp lệ"),
  body("reason")
    .isIn(["lost-pet", "your-pet"])
    .withMessage(
      "Lý do tạo bài đăng là bắt buộc và phải là một trong các giá trị được chỉ định"
    ),
  body("sizePet")
    .optional()
    .isIn(["small", "medium", "big"])
    .withMessage(
      "Kích thước thú cưng là bắt buộc và phải là một trong các giá trị được chỉ định"
    ),
  body("genderPet")
    .optional()
    .isIn(["male", "female"])
    .withMessage("Giới tính thú cưng không hợp lệ"),
  body("location")
    .notEmpty()
    .withMessage("Vị trí không hợp lệ")
    .isString()
    .withMessage("Vị trí không hợp lệ")
    .custom((value) => {
      // Check if the value matches the pattern "city-district-ward"
      const locationPattern = /^[^\s].*-[^\s].*-[^\s].*$/;
      if (!locationPattern.test(value)) {
        throw new Error("Vị trí phải được định dạng là 'city-district-ward'");
      }
      return true;
    }),
  body("description")
    .notEmpty()
    .withMessage("Chưa cung cấp mô tả")
    .isString()
    .withMessage("Mô tả bài viết không hợp lệ"),
  body("healthInfo")
    .notEmpty()
    .withMessage("Chưa cung cấp thông tin sức khỏe thú cưng")
    .isString()
    .withMessage("Thông tin sức khỏe thú cưng không hợp lệ"),
  body("contactInfo")
    .notEmpty()
    .withMessage("Chưa cung cấp thông tin liên hệ")
    .isString()
    .withMessage("Thông tin liên hệ không hợp lệ"),
];

export const getPetAdoptionPostBySearchValidator = [
  query("petType")
    .optional()
    .isIn([
      "all",
      "dog",
      "cat",
      "bird",
      "rabbit",
      "fish",
      "rodents",
      "reptile",
      "other",
    ])
    .withMessage("Kiểu thú cưng không hợp lệ"),
  query("gender")
    .optional()
    .isIn(["all", "male", "female"])
    .withMessage("Giới tính tìm kiếm không hợp lệ"),
  query("size")
    .optional()
    .isIn(["all", "small", "medium", "big"])
    .withMessage("Kích thước tìm kiếm không hợp lệ"),
  query("location")
    .optional()
    .isString()
    .withMessage("Vị trí tìm kiếm không hợp lệ")
    .custom((value) => {
      const locationPattern = /^[^\s]+-[^\s]+-[^\s]+$/;
      if (!locationPattern.test(value)) {
        throw new Error(
          "Vị trí tìm kiếm phải có định dạng 'city-district-ward'"
        );
      }
      return true;
    }),
  query("status")
    .optional()
    .isIn(["all", "available", "adopted"])
    .withMessage("Trạng thái bài viết tìm kiếm không hợp lệ"),
  query("reason")
    .optional()
    .isIn(["all", "lost-pet", "your-pet"])
    .withMessage("Lý do của bài viết tìm kiếm không hợp lệ"),
];

export const getPetAdoptionPostByIdValidator = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const deletePetAdoptionPostByIdValidator = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const postComment = [
  body("content").notEmpty().withMessage("Nội dung bình luận không hợp lệ"),
  body("postId").notEmpty().withMessage("Cần cung cấp ID bài viết"),
];

export const getComment = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const getAdoptedPetOwner = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const getConfirmByPostValidator = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const confirmAdoptPet = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
  body("confirmed")
    .notEmpty()
    .isBoolean()
    .withMessage("Xác nhận có kiểu không hợp lệ"),
];
