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
    .withMessage("typePet is required and must be one of the specified values"),
  body("reason")
    .isIn(["lost-pet", "your-pet"])
    .withMessage(
      "Reason create post is required and must be one of the specified values"
    ),
  body("sizePet")
    .isIn(["small", "medium", "big"])
    .withMessage(
      "Size pet is required and must be one of the specified values"
    ),
  body("genderPet")
    .optional()
    .isIn(["male", "female"])
    .withMessage("genderPet, if provided, must be either 'male' or 'female'"),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string")
    .custom((value) => {
      // Check if the value matches the pattern "city-district-ward"
      const locationPattern = /^[^\s].*-[^\s].*-[^\s].*$/;
      if (!locationPattern.test(value)) {
        throw new Error("Location must be formatted as 'city-district-ward'");
      }
      return true;
    }),
  body("description")
    .notEmpty()
    .withMessage("description is required")
    .isString()
    .withMessage("description must be a string"),
  body("healthInfo")
    .notEmpty()
    .withMessage("Health info is required")
    .isString()
    .withMessage("Health info must be a string"),
  body("contactInfo")
    .notEmpty()
    .withMessage("contactInfo is required")
    .isString()
    .withMessage("contactInfo must be a string"),
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
  query("location")
    .optional()
    .isString()
    .withMessage("Location must be a string")
    .custom((value) => {
      const locationPattern = /^[^\s]+-[^\s]+-[^\s]+$/;
      if (!locationPattern.test(value)) {
        throw new Error("Location must be formatted as 'city-district-ward'");
      }
      return true;
    }),
  query("status")
    .optional()
    .isIn(["all", "available", "adopted"])
    .withMessage("Status must be one of 'all', 'available', 'adopted'"),
  query("reason")
    .optional()
    .isIn(["all", "lost-pet", "your-pet"])
    .withMessage("Status must be one of 'all', 'lost-pet', 'your-pet'"),
];

export const getPetAdoptionPostByIdValidator = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
];

export const deletePetAdoptionPostByIdValidator = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
];

export const postComment = [
  body("content").notEmpty().withMessage("Content is required"),
  body("postId").notEmpty().withMessage("Post Id is required"),
];

export const getComment = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
];
