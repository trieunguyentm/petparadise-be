import { body } from "express-validator";

export const createChatValidator = [
  body("members")
    .isArray({ min: 1 }) // Kiểm tra xem members có phải là mảng có ít nhất 1 phần tử không
    .withMessage("Các thành viên phải là một mảng có ít nhất một ID thành viên.")
    .custom(
      (
        members: string[] // Chỉ định rằng members là một mảng của chuỗi
      ) =>
        members.every(
          (member: string) => typeof member === "string" && member.trim() !== ""
        )
    ) // Mỗi phần tử trong mảng phải là một chuỗi và không trống
    .withMessage("Tất cả ID thành viên phải là chuỗi hoặc ID thành viên không được để trống")
    .custom((members: string[]) => {
      // Thêm bộ kiểm tra cho tính duy nhất
      const uniqueMembers = new Set(members);
      if (uniqueMembers.size !== members.length) {
        throw new Error("Mỗi ID thành viên phải là duy nhất.");
      }
      return true;
    })
    .withMessage("ID thành viên phải là duy nhất, không được phép trùng lặp."),

  body("members") // Xử lý điều kiện khi members có 2 thành viên trở lên
    .if((members: string[]) => members.length >= 2)
    .custom((members: string[], { req }) => {
      if (!req.body.name) {
        // Kiểm tra nếu không có trường name
        throw new Error(
          "Cần phải có tên khi tạo cuộc trò chuyện nhóm có nhiều hơn hai thành viên."
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
        throw new Error("groupPhoto phải là một tệp nếu được cung cấp.");
      }
      return true; // Chấp nhận nếu không có file hoặc file hợp lệ
    }),
];
