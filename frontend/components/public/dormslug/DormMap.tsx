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
    <div className="">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
        <MapPin className="text-red-500" />
        แผนที่และการเดินทาง
      </h3>
      {address && <p className="mb-4 text-sm text-gray-600">{address}</p>}
      <div className="group relative h-75 w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm md:h-100">
        {hasValidLatLng ? (
          <iframe
            width="100%"
            height="100%"
            style={{
              border: 0,
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=th&z=15&output=embed`}
            className="h-full w-full grayscale-20 transition-all duration-500 group-hover:grayscale-0"
          ></iframe>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-50 text-center">
            <MapPin className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูลตำแหน่งแผนที่</p>
          </div>
        )}
        {mapUrl && (
          <div className="absolute right-4 bottom-4 z-10">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl active:scale-95"
            >
              <ExternalLink size={18} />
              <span>นำทางใน Google Maps</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
