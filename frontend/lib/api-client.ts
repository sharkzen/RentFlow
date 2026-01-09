import axiosClient from "axios";

export const axios = axiosClient.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let queue: (() => void)[] = [];

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // ❗ ถ้า refresh เองแล้ว → ห้ามเข้าอีก
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        return axios(originalRequest);
      }

      isRefreshing = true;

      try {
        await axios.post("/api/auth/refresh");
        queue.forEach((cb) => cb());
        queue = [];
        return axios(originalRequest);
      } catch {
        queue = [];
        // ❗ สำคัญ: ห้ามยิงซ้ำอีก
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
