import { body, param, query } from "express-validator";

export const changePasswordValidator = [
  body("currentPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .notEmpty()
    .withMessage("New password is required"),
];

export const updateUserValidator = [
  body("location")
    .optional() // Make location optional
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
  body("typePet")
    .optional() // Make typePet optional
    .isArray()
    .withMessage("TypePet must be an array")
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
        throw new Error("TypePet array contains invalid values");
      }
      return true;
    }),
];

export const likePostValidator = [
  body("postID").notEmpty().withMessage("Post ID is required"),
];

export const savePostValidator = [
  body("postID").notEmpty().withMessage("Post ID is required"),
];

export const followValidator = [
  body("peopleID").notEmpty().withMessage("People ID is required"),
];

export const searchValidator = [
  query("query").notEmpty().withMessage("Query is required"),
];
