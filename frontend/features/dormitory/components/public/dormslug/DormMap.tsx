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

  const navigateUrl = hasValidLatLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : mapUrl;

  return (
    <div>
      <h3 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
        <MapPin size={18} className="text-red-500" />
        แผนที่และการเดินทาง
      </h3>

      {address && (
        <p className="text-muted mb-4 flex items-start gap-2 text-sm">
          <MapPin size={14} className="text-muted mt-0.5 shrink-0" />
          {address}
        </p>
      )}

      <div className="border-border relative h-64 w-full overflow-hidden rounded-xl border shadow-sm md:h-80">
        {hasValidLatLng ? (
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${latitude},${longitude}!6i15!3m1!1sth!5m1!1sth`}
            className="h-full w-full"
          />
        ) : (
          <div className="bg-background flex h-full flex-col items-center justify-center gap-3 text-center">
            <MapPin className="text-muted h-10 w-10 opacity-50" />
            <p className="text-muted text-sm">ยังไม่มีข้อมูลตำแหน่งแผนที่</p>
          </div>
        )}

        {navigateUrl && (
          <div className="absolute right-4 bottom-4 z-10">
            <a
              href={navigateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-md transition-all hover:bg-blue-50 hover:shadow-lg active:scale-95 dark:hover:bg-blue-950/40"
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
