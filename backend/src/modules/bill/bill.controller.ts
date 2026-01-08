import { FastifyRequest, FastifyReply } from "fastify";
import { billService } from "./bill.service";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";

export const BillController = {
  getBills: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;
      const query = request.query as any;

      const { dormId } = request.params as {
        dormId: string;
      };

      if (!dormId)
        return reply.status(400).send({
          message: "DORM_ID_REQUIRED",
        });

      const result = await billService.getBills({
        dormId,
        sub: user.sub,
        ...query,
      });

      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: error.message,
      });
    }
  },

  createBills: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;
      const body = request.body as any;
      const result = await billService.createBills(user.sub, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: error.message,
      });
    }
  },

  updateStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId } = request.params as {
        billId: string;
      };

      const { status } = request.body as {
        status: string;
      };

      const result = await billService.updateStatus(
        user.sub,
        billId,
        status as any,
      );
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: error.message,
      });
    }
  },
};
