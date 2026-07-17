import prisma from "@/lib/prisma";
import { LandmarkDto } from "./dto/landmark.dto";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { generateSlug } from "@/lib/text";

export const landmarkService = {
  async getAllLandmarks() {
    return await prisma.landmark.findMany({
      where: {
        status: "ACTIVE",
      },
    });
  },

  async createLandmark(dto: LandmarkDto) {
    const latLng = await getLatLngFromUrl(dto.mapUrl);

    if (!latLng) {
      throw new Error("INVALID_MAP_URL");
    }

    const slug = generateSlug(dto.name);

    await prisma.landmark.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        mapUrl: dto.mapUrl,
        latitude: latLng.lat,
        longitude: latLng.lng,
        status: "ACTIVE",
      },
    });
  },
};
