import axiosClient from "axios";

export const axios = axiosClient.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let queue: (() => void)[] = [];

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => {
          queue.push(resolve);
        });
        return axios(originalRequest);
      }

      isRefreshing = true;

      try {
        await axios.post("/api/auth/refresh");

        queue.forEach((cb) => cb());
        queue = [];

        return axios(originalRequest);
      } catch (refreshError) {
        queue = [];
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
