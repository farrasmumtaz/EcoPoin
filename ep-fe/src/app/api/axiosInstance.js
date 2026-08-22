import axios from "axios";

{
  /* Berfungsi untuk memanggil fungsi Axios*/
}

const url = import.meta.env.NEXT_PUBLIC_API_URL;

const axiosInstanceDefault = axios.create({
  baseURL: url,
  headers: {
    "Content-Type": "application/json",
  },
});

{
  /* Berfungsi untuk memanggil fungsi Axios namun versi Authenticated, digunakan untuk fitur fitur yang membutuhkan header Authorization */
}
const axiosInstanceAuthenticated = axios.create({
  baseURL: url,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstanceAuthenticated.interceptors.request.use((config) => {
  const token = localStorage.getItem("idToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstanceAuthenticated.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export { axiosInstanceDefault, axiosInstanceAuthenticated };
