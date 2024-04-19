import { body } from "express-validator";

export const createChatValidator = [
  body("members")
    .isArray({ min: 1 }) // Kiểm tra xem members có phải là mảng có ít nhất 1 phần tử không
    .withMessage("Members must be an array with at least one member ID.")
    .custom(
      (
        members: string[] // Chỉ định rằng members là một mảng của chuỗi
      ) =>
        members.every(
          (member: string) => typeof member === "string" && member.trim() !== ""
        )
    ) // Mỗi phần tử trong mảng phải là một chuỗi và không trống
    .withMessage("All members IDs must be strings or memberIDs not empty")
    .custom((members: string[]) => {
      // Thêm bộ kiểm tra cho tính duy nhất
      const uniqueMembers = new Set(members);
      if (uniqueMembers.size !== members.length) {
        throw new Error("Each member ID must be unique.");
      }
      return true;
    })
    .withMessage("Member IDs must be unique, no duplicates allowed."),

  body("members") // Xử lý điều kiện khi members có 2 thành viên trở lên
    .if((members: string[]) => members.length >= 2)
    .custom((members: string[], { req }) => {
      if (!req.body.name) {
        // Kiểm tra nếu không có trường name
        throw new Error(
          "Name is required when creating a group chat with more than two members."
        );
      }
      return true; // Tiếp tục nếu có trường name
    }),

  body("groupPhoto") // Kiểm tra groupPhoto
    .optional({ checkFalsy: true }) // Là một trường không bắt buộc
    .custom((value: any, { req }) => {
      if (req.file) {
        return true;
      } else if (value) {
        throw new Error("groupPhoto must be a file if provided.");
      }
      return true; // Chấp nhận nếu không có file hoặc file hợp lệ
    }),
];
