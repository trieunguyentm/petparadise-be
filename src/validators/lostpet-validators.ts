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
    .withMessage("typePet is required and must be one of the specified values"),
  body("genderPet")
    .optional()
    .isIn(["male", "female"])
    .withMessage("genderPet, if provided, must be either 'male' or 'female'"),
  body("sizePet")
    .optional()
    .isIn(["small", "medium", "big"])
    .withMessage(
      "sizePet, if provided, must be either 'small', 'medium' or 'big'"
    ),
  body("lastSeenLocation")
    .notEmpty()
    .withMessage("lastSeenLocation is required")
    .isString()
    .withMessage("lastSeenLocation must be a string")
    .custom((value) => {
      // Check if the value matches the pattern "city-district-ward"
      const locationPattern = /^[^\s]+-[^\s]+-[^\s]+$/;
      if (!locationPattern.test(value)) {
        throw new Error(
          "lastSeenLocation must be formatted as 'city-district-ward'"
        );
      }
      return true;
    }),
  body("lastSeenDate")
    .notEmpty()
    .withMessage("lastSeenDate is required")
    .isISO8601()
    .withMessage("lastSeenDate must be a valid date"),
  body("description")
    .notEmpty()
    .withMessage("description is required")
    .isString()
    .withMessage("description must be a string"),
  // contactInfo: bắt buộc, kiểu dữ liệu string
  body("contactInfo")
    .notEmpty()
    .withMessage("contactInfo is required")
    .isString()
    .withMessage("contactInfo must be a string"),
];

export const getFindPetPostByIdValidator = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
];

export const updateFindPetPostByIdValidator = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
];

export const deleteFindPetPostByIdValidator = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
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
    .withMessage(
      "petType must be one of 'all', 'dog', 'cat', 'bird', 'rabbit', 'fish', 'rodents', 'reptile', 'other'"
    ),
  query("gender")
    .optional()
    .isIn(["all", "male", "female"])
    .withMessage("gender must be one of 'all', 'male', or 'female'"),
  query("size")
    .optional()
    .isIn(["all", "small", "medium", "big"])
    .withMessage("size must be one of 'all', 'small', 'medium', or 'big'"),
  query("lastSeenLocation")
    .optional()
    .isString()
    .withMessage("lastSeenLocation must be a string")
    .custom((value) => {
      const locationPattern = /^[^\s]+-[^\s]+-[^\s]+$/;
      if (!locationPattern.test(value)) {
        throw new Error(
          "lastSeenLocation must be formatted as 'city-district-ward'"
        );
      }
      return true;
    }),
  query("lastSeenDate")
    .optional()
    .isISO8601()
    .withMessage("lastSeenDate must be a valid date"),
];

export const postComment = [
  body("content").notEmpty().withMessage("Content is required"),
  body("postId").notEmpty().withMessage("Post Id is required"),
];

export const getComment = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
];
