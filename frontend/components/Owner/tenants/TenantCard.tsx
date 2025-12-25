type Tenant = { id: string; name: string; room: string };

type Props = {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
};

export default function TenantCard({ tenant, onEdit }: Props) {
  return (
    <div className="flex items-center justify-between rounded border p-4 shadow-sm transition hover:shadow-md">
      <div>
        <p className="font-semibold">{tenant.name}</p>
        <p className="text-gray-500">ห้อง {tenant.room}</p>
      </div>
      <button
        className="text-blue-500 hover:underline"
        onClick={() => onEdit(tenant)}
      >
        แก้ไข
      </button>
    </div>
  );
}
