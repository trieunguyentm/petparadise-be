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
