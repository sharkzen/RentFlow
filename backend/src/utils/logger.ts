import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino(
  isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
);

export default logger;
