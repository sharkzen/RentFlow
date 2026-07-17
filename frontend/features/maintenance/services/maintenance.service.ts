import { axios } from "@/lib/api/api-client";
import { MaintenanceFilterStatus } from "@/features/maintenance/components/MaintenanceFilter";
import { MaintenanceStatus } from "../types";

interface GetMaintenanceParams {
  dormId: string;
  search?: string;
  status?: MaintenanceFilterStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const maintenanceService = {
  getMaintenances: async ({
    dormId,
    search,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  }: GetMaintenanceParams) => {
    const res = await axios.get(`/api/maintenances`, {
      params: {
        dormId,
        search: search || undefined,
        status: status === "ALL" ? undefined : status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit,
      },
    });

    return res.data;
  },

  updateStatus: async (
    id: string,
    status: MaintenanceStatus,
    note?: string,
  ) => {
    const res = await axios.patch(`/api/maintenances/${id}/status`, {
      status,
      note,
    });

    return res.data;
  },
};
