"use client";
import { scroller } from "react-scroll";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DormService } from "@/features/dormitory/services/dorm.service";
import Dormitory from "@/features/dormitory/components/Dormitory";
import DormFilter from "@/features/dormitory/components/DormFilter";

export default function IndexContainer() {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const HEADER_HEIGHT = 75;

  useEffect(() => {
    if (searchParams.get("focus") === "filter") {
      scroller.scrollTo("dorm-filter", {
        duration: 800,
        smooth: "easeInOutCubic",
        offset: -HEADER_HEIGHT,
      });
      const params = new URLSearchParams(searchParams.toString());
      params.delete("focus");
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = {
          search: searchParams.get("search"),
          landmarkId: searchParams.get("landmarkId"),
          minPrice: searchParams.get("minPrice"),
          maxPrice: searchParams.get("maxPrice"),
        };

        const data = await DormService.getAllDroms(query);
        setDorms(data);
      } catch (error) {
        console.error("Error fetching dorms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  return (
    <div className="p-4">
      <DormFilter />

      {loading ? (
        <div className="py-10 text-center text-gray-500">
          กำลังค้นหาหอพัก...
        </div>
      ) : (
        <Dormitory dorms={dorms} />
      )}
    </div>
  );
}
