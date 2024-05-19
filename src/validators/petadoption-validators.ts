import { body } from "express-validator";

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
