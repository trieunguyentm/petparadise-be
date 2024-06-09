import Mailgen from "mailgen";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Pet Paradise",
    link: "http://localhost:3000/",
  },
});

export const generateRegisterMail = (to: string, randomCode: number) => {
  const email = {
    body: {
      name: to,
      intro: `You have just registered an account on the Pet Paradise system. Below is your confirmation code (this code is valid for 5 minutes): <div style="text-align:center; font-weight:bold;">${randomCode}</div>`,
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
      intro: `You have just restored the password on the Pet Paradise system. Below is your confirmation code, valid for 5 minutes: <div style="text-align:center; font-weight:bold;">${randomCode}</div>`,
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
          link: `http://localhost:3001/pet-adoption/confirm/${id}`,
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
      intro: `You have received a new order #${orderCode}.`,
      table: {
        data: itemTableData,
        columns: {
          // Optionally, customize the columns.
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
          "Please check the details and prepare the items for shipment.",
        button: {
          color: "#22BC66",
          text: "View Order",
          link: `http://localhost:3001/store/manage-order`,
        },
      },
      outro: `Total amount: ${totalAmount
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
      intro: `Your order #${orderCode} has been cancelled.`,
      outro:
        "We apologize for any inconvenience caused. If you have any questions, please contact our support team.",
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
      intro: `Your order #${orderCode} has been delivered. Please confirm the receipt.`,
      table: {
        data: products.map((product) => ({
          item: product.name,
          quantity: product.quantity,
          price: product.price,
        })),
        columns: {
          // Optionally, customize the columns in the table
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
        instructions: "To confirm receipt, please click the following button:",
        button: {
          color: "#22BC66",
          text: "Confirm Receipt",
          link: `http://localhost:3000/store/purchased-order`,
        },
      },
      outro: "Thank you for shopping with Pet Paradise!",
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
      intro: `Your order #${orderCode} has been successfully completed! Thank you for shopping with us.`,
      table: {
        data: items.map((item) => ({
          "Product Name": item.name,
          Quantity: item.quantity,
          Price:
            item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ",
        })),
        columns: {
          // Optionally, customize the column widths
          customWidth: {
            "Product Name": "50%",
            Quantity: "25%",
            Price: "25%",
          },
          // Optionally, change column text alignment
          customAlignment: {
            Price: "right",
          },
        },
      },
      action: {
        instructions:
          "You can view your order details and track the shipment here:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "View Order",
          link: `http://localhost:3000/store/purchased-order/${orderCode}`,
        },
      },
      outro:
        "If you have any questions, just reply to this email—we're always happy to help.",
    },
  };

  // Generate an HTML email with the provided contents
  const emailBody = mailGenerator.generate(email);

  // Generate the plaintext version of the email
  const emailText = mailGenerator.generatePlaintext(email);

  return emailBody;
};
