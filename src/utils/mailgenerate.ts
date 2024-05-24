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
      }.`,
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
        instructions: "Bạn có thể xem chi tiết hơn tại đây",
        button: {
          color: "#22BC66",
          text: "Xem chi tiết",
          link: `http://localhost:3001/pet-adoption/${id}`,
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
