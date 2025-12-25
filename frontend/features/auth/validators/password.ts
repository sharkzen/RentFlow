export const isValidPassword = (password: string) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  return regex.test(password);
};
