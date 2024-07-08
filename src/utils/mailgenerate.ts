import Mailgen from "mailgen";
import dotenv from "dotenv";

dotenv.config();

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Pet Paradise",
    link: process.env.FE_URL as string,
  },
});

export const generateRegisterMail = (to: string, randomCode: number) => {
  const email = {
    body: {
      name: to,
      intro: `Bạn vừa đăng ký tài khoản trên hệ thống Pet Paradise. Dưới đây là mã xác nhận của bạn (mã này có hiệu lực trong 5 phút): <div style="text-align:center; font-weight:bold;">${randomCode}</div>`,
    },
  };
  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};

export const generateRecoveryPasswordMail = (
  to: string,
  randomCode: number
) => {
  const email = {
    body: {
      name: to,
      intro: `Bạn vừa khôi phục mật khẩu trên hệ thống Pet Paradise. Dưới đây là mã xác nhận của bạn, có hiệu lực trong 5 phút: <div style="text-align:center; font-weight:bold;">${randomCode}</div>`,
    },
  };
  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};

export const generateAdoptionResponseMail = (
  to: string,
  status: "approved" | "rejected",
  id: string,
  petName: string,
  petType: string,
  contactInfo: string
) => {
  const statusText = status === "approved" ? "approved" : "rejected";
  const email = {
    body: {
      name: to,
      intro: `Yêu cầu nhận nuôi thú cưng (${petType}) của bạn đã ${
        statusText === "approved" ? "được chấp nhận" : "bị từ chối"
      }. ${
        statusText === "approved" &&
        "Hãy liên hệ với chủ thú cưng và nhận thú cưng. Khi 2 bên trao đổi thành công các bạn sẽ cần phải xác nhận trên hệ thống. Hãy nhớ xác nhận lại việc giao dịch nhé."
      }`,
      table: {
        data: [
          {
            item: "Tên thú cưng",
            description: petName,
          },
          {
            item: "Loại thú cưng",
            description: petType,
          },
          {
            item: "Thông tin liên hệ",
            description: contactInfo,
          },
        ],
      },
      action: {
        instructions: "Bạn có thể xác nhận nuôi thú cưng tại đây",
        button: {
          color: "#22BC66",
          text: "Xác nhận đồng ý nuôi",
          link: `${process.env.FE_URL}/pet-adoption/confirm/${id}`,
        },
      },
      outro:
        "Cảm ơn bạn đã sử dụng Pet Paradise. Chúng tôi hy vọng bạn tận hưởng thời gian vui vẻ với thú cưng mới của mình!",
    },
  };

  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};

export const generateOrderNotificationMail = (
  sellerName: string,
  orderCode: number,
  buyerName: string,
  items: { name: string; quantity: number; price: number }[],
  totalAmount: number
) => {
  const itemTableData = items.map((item) => ({
    item: item.name,
    quantity: item.quantity,
    price: `${item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`,
  }));

  const email = {
    body: {
      name: sellerName,
      intro: `Bạn vừa nhận được một đơn hàng mới #${orderCode}.`,
      table: {
        data: itemTableData,
        columns: {
          // Tùy chọn, tùy chỉnh các cột.
          customWidth: {
            item: "20%",
            quantity: "10%",
            price: "20%",
          },
          customAlignment: {
            price: "right",
          },
        },
      },
      action: {
        instructions:
          "Vui lòng kiểm tra chi tiết và chuẩn bị các mặt hàng để giao hàng.",
        button: {
          color: "#22BC66",
          text: "Xem Đơn Hàng",
          link: `${process.env.FE_URL}/store/manage-order`,
        },
      },
      outro: `Tổng số tiền: ${totalAmount
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`,
    },
  };

  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};

export const generateOrderCancelledMail = (
  buyerName: string,
  orderCode: number
) => {
  const email = {
    body: {
      name: buyerName,
      intro: `Đơn hàng #${orderCode} của bạn đã bị hủy.`,
      outro:
        "Chúng tôi xin lỗi vì bất kỳ sự bất tiện nào gây ra. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.",
    },
  };
  return mailGenerator.generate(email);
};

export const generateOrderDeliveredMail = (
  buyerName: string,
  orderCode: number,
  products: { name: string; quantity: number; price: number }[]
) => {
  const email = {
    body: {
      name: buyerName,
      intro: `Đơn hàng #${orderCode} của bạn đã được giao. Vui lòng xác nhận đã nhận hàng.`,
      table: {
        data: products.map((product) => ({
          item: product.name,
          quantity: product.quantity,
          price: product.price,
        })),
        columns: {
          // Tùy chọn, tùy chỉnh các cột trong bảng
          customWidth: {
            item: "20%",
            quantity: "10%",
            price: "10%",
          },
          customAlignment: {
            price: "right",
          },
        },
      },
      action: {
        instructions: "Để xác nhận đã nhận hàng, vui lòng nhấn vào nút sau:",
        button: {
          color: "#22BC66",
          text: "Xác Nhận Đã Nhận Hàng",
          link: `${process.env.FE_URL}/store/purchased-order`,
        },
      },
      outro: "Cảm ơn bạn đã mua sắm tại Pet Paradise!",
    },
  };
  return mailGenerator.generate(email);
};

export const generateOrderSuccessMail = (
  buyerName: string,
  orderCode: number,
  items: { name: string; quantity: number; price: number }[]
) => {
  const email = {
    body: {
      name: buyerName,
      intro: `Đơn hàng #${orderCode} của bạn đã hoàn tất thành công! Cảm ơn bạn đã mua sắm với chúng tôi.`,
      table: {
        data: items.map((item) => ({
          "Tên Sản Phẩm": item.name,
          "Số Lượng": item.quantity,
          Giá:
            item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ",
        })),
        columns: {
          // Tùy chọn, tùy chỉnh độ rộng của các cột
          customWidth: {
            "Tên Sản Phẩm": "50%",
            "Số Lượng": "25%",
            Giá: "25%",
          },
          // Tùy chọn, thay đổi căn chỉnh văn bản của cột
          customAlignment: {
            Giá: "right",
          },
        },
      },
      action: {
        instructions:
          "Bạn có thể xem chi tiết đơn hàng và theo dõi vận chuyển tại đây:",
        button: {
          color: "#22BC66", // Màu tùy chọn của nút hành động
          text: "Xem Đơn Hàng",
          link: `${process.env.FE_URL}/store/purchased-order/${orderCode}`,
        },
      },
      outro:
        "Nếu bạn có bất kỳ câu hỏi nào, chỉ cần trả lời email này - chúng tôi luôn sẵn lòng giúp đỡ.",
    },
  };

  // Tạo một email HTML với nội dung được cung cấp
  const emailBody = mailGenerator.generate(email);

  // Tạo phiên bản văn bản thuần của email
  const emailText = mailGenerator.generatePlaintext(email);

  return emailBody;
};

export const generateNotificationCancelOrderMail = (
  sellerName: string,
  orderCode: number,
  buyerName: string,
  buyerEmail: string,
  products: { name: string; quantity: number; price: number }[]
) => {
  const email = {
    body: {
      name: sellerName,
      intro: `Người mua ${buyerName} (${buyerEmail}) đã xác nhận chưa hoàn thành đơn hàng #${orderCode}. Vui lòng kiểm tra lại và cập nhật trạng thái đơn hàng.`,
      table: {
        data: products.map((product) => ({
          item: product.name,
          description: `${product.quantity} x ${product.price}đ`,
        })),
      },
      outro: "Cảm ơn bạn đã sử dụng Pet Paradise.",
    },
  };

  const emailBody = mailGenerator.generate(email);
  return emailBody;
};

export const generateBanNotificationMail = (
  to: string,
  banDuration: number
) => {
  const email = {
    body: {
      name: to,
      intro: `Tài khoản của bạn trên hệ thống Pet Paradise đã bị khóa. Thời gian khóa tài khoản là ${banDuration} giờ.`,
      outro: "Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.",
    },
  };
  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};

export const generateWithdrawalCompletedMail = (
  username: string,
  amount: number
) => {
  const email = {
    body: {
      name: username,
      intro: `Yêu cầu nhận tiền của bạn với số tiền ${amount} đã được xử lý thành công.`,
      outro: "Trân trọng, Đội ngũ hỗ trợ Pet Paradise",
    },
  };
  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};

export const generateRefundSuccessMail = (
  username: string,
  amount: number,
  orderCode: number
) => {
  const email = {
    body: {
      name: username,
      intro: `Chúng tôi rất vui thông báo rằng yêu cầu hoàn lại số tiền ${amount} VND cho đơn hàng có mã số ${orderCode} của bạn đã được xử lý thành công.`,
      table: {
        data: [
          {
            "Mã đơn hàng": orderCode,
            "Số tiền hoàn lại": `${amount} VND`,
          },
        ],
      },
      outro:
        "Cảm ơn bạn đã sử dụng Pet Paradise. Chúng tôi mong muốn mang đến cho bạn dịch vụ tốt nhất.",
    },
  };

  // Generate the email body
  const emailBody = mailGenerator.generate(email);

  /** Return HTML email */
  return emailBody;
};
