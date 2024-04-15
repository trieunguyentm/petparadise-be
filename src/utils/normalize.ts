// Hàm loại bỏ dấu tiếng Việt và chuyển đổi thành chữ thường
export const normalizeQuery = (str: string) => {
  return str
    .normalize("NFD") // chuyển đổi chuỗi thành dạng phân tách
    .replace(/[\u0300-\u036f]/g, "") // loại bỏ các ký tự dấu
    .toLowerCase(); // chuyển thành chữ thường
};
