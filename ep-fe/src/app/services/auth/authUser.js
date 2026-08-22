import { axiosInstanceDefault } from "../../api/axiosInstance.js";

export const authUser = async (email, password) => {
  {
    /* Berfungsi untuk logic login ke website kita, membutuhkan dua parameter berupa email dan password user, fungsi tersebut akan mengembalikan respon dari backend dalam bentuk JSON */
  }
  try {
    const response = await axiosInstanceDefault.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (e) {
    throw e.message || e.detail;
  }
};
