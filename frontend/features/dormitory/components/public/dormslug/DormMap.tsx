import React from "react";
import { MapPin, ExternalLink } from "lucide-react";

interface DormMapProps {
  latitude: number;
  longitude: number;
  mapUrl: string;
  address: string;
}

export const DormMap: React.FC<DormMapProps> = ({
  latitude,
  longitude,
  mapUrl,
  address,
}) => {
  const hasValidLatLng =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !(latitude === 0 && longitude === 0);

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MapPin size={18} className="text-red-500" />
        แผนที่และการเดินทาง
      </h3>

      {address && (
        <p className="mb-4 flex items-start gap-2 text-sm text-slate-500">
          <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
          {address}
        </p>
      )}

      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-100 shadow-sm md:h-80">
        {hasValidLatLng ? (
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=th&z=15&output=embed`}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 text-center">
            <MapPin className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">
              ยังไม่มีข้อมูลตำแหน่งแผนที่
            </p>
          </div>
        )}

        {mapUrl && (
          <div className="absolute right-4 bottom-4 z-10">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-md transition-all hover:bg-blue-50 hover:shadow-lg active:scale-95"
            >
              <ExternalLink size={15} />
              นำทางใน Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
