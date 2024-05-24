import { body, param } from "express-validator";

export const createAdoptionRequest = [
  body("petAdoptionPost").notEmpty().withMessage("petAdoptionPost is required"),
  body("type")
    .isIn(["reclaim-pet", "adopt-pet"])
    .withMessage("Type Adoption Request must be one of the specified values"),
  body("descriptionForPet")
    .optional()
    .isString()
    .withMessage("Description for pet must be a string"),
  body("descriptionForUser")
    .optional()
    .isString()
    .withMessage("Description for user must be a string"),
  body("contactInfo")
    .isString()
    .withMessage("Contact information must be a string"),
];

export const handleGetAdoptionRequestValidator = [
  param("postId").notEmpty().withMessage("postId must be a ID"),
]
