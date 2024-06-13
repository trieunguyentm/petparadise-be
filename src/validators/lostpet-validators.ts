import { body, param, query } from "express-validator";

export const createFindPetPostValidator = [
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
    .withMessage(
      "Kiểu thú cưng là bắt buộc và phải là một trong các giá trị được chỉ định"
    ),
  body("genderPet")
    .optional()
    .isIn(["male", "female"])
    .withMessage("Giới tính thú cưng không phù hợp"),
  body("sizePet")
    .optional()
    .isIn(["small", "medium", "big"])
    .withMessage("Kích thước thú cưng không hợp lệ"),
  body("lastSeenLocation")
    .notEmpty()
    .withMessage("Chưa cung cấp vị trí lần cuối thấy thú cưng")
    .isString()
    .withMessage("Vị trí lần cuối thấy thú cưng không hợp lệ")
    .custom((value) => {
      // Check if the value matches the pattern "city-district-ward"
      const locationPattern = /^[^\s].*-[^\s].*-[^\s].*$/;
      if (!locationPattern.test(value)) {
        throw new Error(
          "Vị trị lần cuối thấy thú cưng phải có định dạng 'city-district-ward'"
        );
      }
      return true;
    }),
  body("lastSeenDate")
    .notEmpty()
    .withMessage("Cần cung cấp thời gian lần cuối nhìn thấy thú cưng")
    .isISO8601()
    .withMessage("Thời gian lần cuối nhìn thấy thú cưng không hợp lệ"),
  body("description")
    .notEmpty()
    .withMessage("Chưa cung cấp mô tả")
    .isString()
    .withMessage("Mô tả không phù hợp"),
  // contactInfo: bắt buộc, kiểu dữ liệu string
  body("contactInfo")
    .notEmpty()
    .withMessage("Chưa cung cấp thông tin liên hệ")
    .isString()
    .withMessage("Thông tin liên hệ không phù hợp"),
];

export const getFindPetPostByIdValidator = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const updateFindPetPostByIdValidator = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const deleteFindPetPostByIdValidator = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];

export const getFindPetPostBySearchValidator = [
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
    .withMessage("Giới tính thú cưng không hợp lệ"),
  query("size")
    .optional()
    .isIn(["all", "small", "medium", "big"])
    .withMessage("Kích thước thú cưng không hợp lệ"),
  query("lastSeenLocation")
    .optional()
    .isString()
    .withMessage("Vị trí lần cuối thấy thú cưng không hợp lệ")
    .custom((value) => {
      const locationPattern = /^[^\s]+-[^\s]+-[^\s]+$/;
      if (!locationPattern.test(value)) {
        throw new Error(
          "Vị trí lần cuối thấy thú cưng phải có định dạng 'city-district-ward'"
        );
      }
      return true;
    }),
  query("lastSeenDate")
    .optional()
    .isISO8601()
    .withMessage("Thời gian lần cuối thấy thú cưng không hợp lệ"),
];

export const postComment = [
  body("content").notEmpty().withMessage("Chưa điền nội dung bình luận"),
  body("postId").notEmpty().withMessage("Chưa cung cấp ID bài viết"),
];

export const getComment = [
  param("postId").notEmpty().withMessage("ID bài viết không hợp lệ"),
];
