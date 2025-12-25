"use client";
import { scroller } from "react-scroll";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Dormitory from "@/features/dormitory/components/Dormitory";
import DormFilter from "@/features/dormitory/components/DormFilter";

export default function IndexContainer() {
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
  }, [searchParams]);

  return (
    <div className="p-4">
      <DormFilter />
      <Dormitory />
    </div>
  );
}
