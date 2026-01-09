interface GetMaintenanceQuery {
  dormId: string;
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
}

interface UpdateStatusBody {
  status: string;
}

interface MaintenanceParams {
  id: string;
}
