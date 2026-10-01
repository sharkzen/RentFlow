"use client";
import {
  Plus,
  Building,
  Search,
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import TenantList from "./TenantList";
import { DormService } from "@/features/dormitory/services/dorm.service";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendError";
import AddTenantDialog from "./AddTenantDialog";
import SelectDormModal from "@/features/bill/components/SelectDormModal";
import { Tenant } from "@/features/tenant";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { Dormitory } from "@/features/dormitory";
import LoadingPage from "@/app/(owner)/owner/tenants/loading";

export default function TenantContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  type FilterStatus = "active" | "moved_out" | "all";
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDormDropdownOpen, setIsDormDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 0,
  });

  const LIMIT = 10;

  const filterOptions: {
    label: string;
    value: FilterStatus;
    desc?: string;
  }[] = [
    {
      label: "พักอาศัยอยู่",
      value: "active",
      desc: "ผู้เช่าปัจจุบัน",
    },
    {
      label: "ย้ายออกแล้ว",
      value: "moved_out",
      desc: "ประวัติเก่า",
    },
    {
      label: "ทั้งหมด",
      value: "all",
      desc: "รวมทุกสถานะ",
    },
  ];

  const getDorms = async () => {
    try {
      const res = await DormService.getDorm();
      setDorms(res);

      if (res.length > 0) setSelectedDorm(res[0].id);
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  const getTenants = async () => {
    if (!selectedDorm) return;

    setLoading(true);

    try {
      const res = await TenantService.getTenantDorm({
        dormId: selectedDorm,
        page,
        limit: LIMIT,
        search: search || undefined,
        status: filterStatus,
      });

      setTenants(res.items);

      setMeta({
        total: res.total,
        totalPages: res.totalPages,
      });
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDorms();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedDorm, filterStatus]);

  useEffect(() => {
    getTenants();
  }, [selectedDorm, page, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      getTenants();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSelectDormOpen, setIsSelectDormOpen] = useState(false);
  const [addDormId, setAddDormId] = useState<string>();

  const handleAddClick = () => {
    if (dorms.length > 1) {
      setIsSelectDormOpen(true);
      return;
    }

    setAddDormId(selectedDorm);
    setIsAddModalOpen(true);
  };
  const currentFilterLabel = filterOptions.find(
    (opt) => opt.value === filterStatus,
  )?.label;
  const currentDormName =
    dorms.find((d) => d.id === selectedDorm)?.name || "เลือกหอพัก";

  if (loading) return <LoadingPage />;

  return (
    <div className="bg-background flex w-full max-w-full flex-col gap-6 py-1">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">
          จัดการผู้เช่า
        </h2>
        <p className="text-muted text-sm sm:text-base">
          จัดการรายชื่อผู้เช่าในหอพัก
        </p>
      </div>
      <div className="col-span-12 grid grid-cols-12 gap-3 md:col-span-12 lg:col-span-12 xl:gap-4">
        <div className="relative col-span-6 md:col-span-3 lg:col-span-3">
          <div className="relative h-full">
            <button
              onClick={() => setIsDormDropdownOpen(!isDormDropdownOpen)}
              className={`flex h-full w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${isDormDropdownOpen ? "bg-surface border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-border bg-surface text-foreground hover:border-muted hover:bg-background"}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Building
                  size={18}
                  className={`shrink-0 ${isDormDropdownOpen ? "text-indigo-500" : "text-muted"}`}
                />
                <span className="truncate">{currentDormName}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-muted shrink-0 transition-transform duration-200 ${isDormDropdownOpen ? "rotate-180 text-indigo-500" : ""}`}
              />
            </button>
            {isDormDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsDormDropdownOpen(false)}
                />
                <div className="animate-in fade-in zoom-in-95 border-border bg-surface absolute top-[calc(100%+6px)] left-0 z-50 w-full min-w-50 overflow-hidden rounded-xl border p-1 shadow-xl ring-1 ring-black/5 duration-100">
                  <div className="custom-scrollbar max-h-60 overflow-y-auto">
                    {dorms.map((dorm) => (
                      <button
                        key={dorm.id}
                        onClick={() => {
                          setSelectedDorm(dorm.id);
                          setIsDormDropdownOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedDorm === dorm.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground hover:bg-background"}`}
                      >
                        <span className="truncate pr-2">{dorm.name}</span>
                        {selectedDorm === dorm.id && (
                          <Check
                            size={14}
                            className="shrink-0 text-indigo-600"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="relative col-span-6 md:col-span-3 lg:col-span-2">
          <div className="relative h-full">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex h-full w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${isFilterOpen ? "bg-surface border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-border bg-surface text-foreground hover:border-muted hover:bg-background"}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Filter
                  size={16}
                  className={`shrink-0 ${isFilterOpen ? "text-indigo-500" : "text-muted"}`}
                />
                <span className="truncate">{currentFilterLabel}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-muted shrink-0 transition-transform duration-200 ${isFilterOpen ? "rotate-180 text-indigo-500" : ""}`}
              />
            </button>
            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="animate-in fade-in zoom-in-95 border-border bg-surface absolute top-[calc(100%+6px)] right-0 z-50 w-full min-w-45 space-y-1 rounded-xl border p-1 ring-1 ring-black/5 duration-100 md:right-auto md:left-0">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterStatus(option.value);
                        setIsFilterOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${filterStatus === option.value ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground hover:bg-background"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{option.label}</span>
                        </div>
                        {option.desc && (
                          <span
                            className={`block text-[10px] ${filterStatus === option.value ? "text-indigo-400" : "text-muted"}`}
                          >
                            {option.desc}
                          </span>
                        )}
                      </div>
                      {filterStatus === option.value && (
                        <Check size={14} className="shrink-0 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="relative col-span-12 md:col-span-4 lg:col-span-5">
          <Search className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ / ห้อง / เบอร์โทร"
            className="border-border bg-surface placeholder:text-muted hover:border-muted w-full rounded-lg border py-2.5 pr-4 pl-10 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        <div className="col-span-12 md:col-span-2 lg:col-span-2">
          <button
            onClick={handleAddClick}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>เพิ่มผู้เช่า</span>
          </button>
        </div>
      </div>
      <TenantList
        isLoading={loading}
        tenants={tenants}
        onEditSuccess={getTenants}
        dormId={selectedDorm!}
      />
      {meta.totalPages > 1 && (
        <div className="text-muted flex items-center justify-between pt-2 text-sm">
          <span>ทั้งหมด {meta.total}รายการ</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-border bg-surface hover:bg-background rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span>
              หน้า {page}/ {meta.totalPages}
            </span>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-border bg-surface hover:bg-background rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
      <SelectDormModal
        isOpen={isSelectDormOpen}
        onClose={() => setIsSelectDormOpen(false)}
        dorms={dorms}
        description="เลือกหอพักที่ต้องการเพิ่มผู้เช่า"
        hint="แตะเพื่อเพิ่มผู้เช่าในหอพักนี้"
        onSelect={(id) => {
          setAddDormId(id);
          setIsSelectDormOpen(false);
          setIsAddModalOpen(true);
        }}
      />
      {isAddModalOpen && addDormId && (
        <AddTenantDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          dormId={addDormId}
          onSuccess={() => {
            if (addDormId !== selectedDorm) {
              setSelectedDorm(addDormId);
            } else {
              getTenants();
            }
          }}
        />
      )}
    </div>
  );
}
