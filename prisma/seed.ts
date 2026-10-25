/**
 * Development seed: 1 admin, 2 agents, 1 tenant, and 15 sample properties
 * across 8 Ghana regions (mixed types, rent/sale, and statuses so every
 * part of the app has something to show).
 *
 * Run with:  npm run db:seed     (or `npx prisma db seed`)
 *
 * All seed users share the password:  Password123!
 * (Development only — never use these accounts in production.)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Build an Unsplash CDN URL from a photo id (seed placeholder images). */
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

type SeedProperty = {
  owner: "agent1" | "agent2";
  title: string;
  description: string;
  type: "HOUSE" | "APARTMENT" | "ROOM" | "HOSTEL" | "LAND" | "COMMERCIAL";
  listingType: "RENT" | "SALE";
  price: number; // whole GHS
  pricePeriod: "MONTH" | "YEAR" | "ONE_OFF";
  bedrooms: number | null;
  bathrooms: number | null;
  region: string;
  city: string;
  area: string | null;
  address: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "RENTED_OR_SOLD";
  rejectionReason?: string;
  images: string[];
};

const PROPERTIES: SeedProperty[] = [
  {
    owner: "agent1",
    title: "3 Bedroom House in East Legon",
    description:
      "Spacious 3 bedroom house in a quiet part of East Legon. All rooms ensuite, fitted kitchen, and a boys quarters. Water and power are very reliable here — the house has a polytank and an inverter backup. Two years advance preferred, but terms are negotiable for serious tenants.",
    type: "HOUSE",
    listingType: "RENT",
    price: 6500,
    pricePeriod: "MONTH",
    bedrooms: 3,
    bathrooms: 4,
    region: "Greater Accra",
    city: "Accra",
    area: "East Legon",
    address: "No. 14 Lagos Avenue, East Legon",
    latitude: 5.6364,
    longitude: -0.1624,
    amenities: ["Air Conditioning", "Boys Quarters", "Fitted Kitchen", "Inverter / Solar Power", "Parking Space", "POP Ceiling", "Security / Watchman", "Wardrobes", "Water Reservoir / Polytank"],
    status: "APPROVED",
    images: ["1568605114967-8130f3a36994", "1600596542815-ffad4c1539a9", "1556912167-f556f1f39fdf"],
  },
  {
    owner: "agent1",
    title: "2 Bedroom Apartment in Osu",
    description:
      "Modern 2 bedroom apartment a short walk from Osu Oxford Street. Open-plan kitchen, tiled floors, and 24/7 security with CCTV. Great for young professionals. Rent is payable monthly — no long advance wahala.",
    type: "APARTMENT",
    listingType: "RENT",
    price: 3800,
    pricePeriod: "MONTH",
    bedrooms: 2,
    bathrooms: 2,
    region: "Greater Accra",
    city: "Accra",
    area: "Osu",
    address: "Ring Road East, near Osu Oxford Street",
    latitude: 5.5579,
    longitude: -0.1775,
    amenities: ["Air Conditioning", "Backup Generator", "CCTV Security", "Fitted Kitchen", "Security / Watchman", "Tiled Floors", "Wi-Fi Ready"],
    status: "APPROVED",
    images: ["1522708323590-d24dbb6b0267", "1560448204-e02f11c3d0e2", "1493809842364-78817add7ffb"],
  },
  {
    owner: "agent1",
    title: "Single Room Self-Contained at Madina",
    description:
      "Neat single room self-contained with its own bathroom and kitchenette at Madina Zongo Junction. Prepaid meter is separate. Just 2 minutes from the trotro station and market. One year advance accepted.",
    type: "ROOM",
    listingType: "RENT",
    price: 600,
    pricePeriod: "MONTH",
    bedrooms: 1,
    bathrooms: 1,
    region: "Greater Accra",
    city: "Madina",
    area: "Zongo Junction",
    address: "Near Zongo Junction, off the La-Nkwantanang road",
    latitude: 5.6682,
    longitude: -0.1603,
    amenities: ["Prepaid Meter (ECG)", "Self-Contained", "Tarred Road Access", "Tiled Floors", "Walled & Gated"],
    status: "APPROVED",
    images: ["1505693416388-ac5ce068fe85", "1502672260266-1c1ef2d93688"],
  },
  {
    owner: "agent2",
    title: "4 Bedroom Luxury House for Sale at Trasacco",
    description:
      "Executive 4 bedroom home in Trasacco Valley with a private pool, boys quarters and a study. Lies on a titled 80x100 ft plot in a gated community with tarred roads throughout. All land documents are intact — come and verify everything at Lands Commission before payment.",
    type: "HOUSE",
    listingType: "SALE",
    price: 3200000,
    pricePeriod: "ONE_OFF",
    bedrooms: 4,
    bathrooms: 5,
    region: "Greater Accra",
    city: "Accra",
    area: "Trasacco Valley",
    address: "Trasacco Valley Estates, Adjiringanor",
    latitude: 5.69,
    longitude: -0.136,
    amenities: ["Air Conditioning", "Backup Generator", "Boys Quarters", "CCTV Security", "Fitted Kitchen", "Parking Space", "POP Ceiling", "Security / Watchman", "Study Room", "Wardrobes", "Water Reservoir / Polytank", "Wi-Fi Ready"],
    status: "APPROVED",
    images: ["1512917774080-9991f1c4c750", "1600585154340-be6161a56a0c", "1600047509807-ba8f99d2cdde"],
  },
  {
    owner: "agent2",
    title: "2 Bedroom Apartment at Ahodwo, Kumasi",
    description:
      "Well-kept 2 bedroom apartment at Ahodwo, close to the Ahodwo roundabout and Melcom. The compound is walled and gated with a night watchman. Water flows regularly and there's a reservoir for dry days.",
    type: "APARTMENT",
    listingType: "RENT",
    price: 1800,
    pricePeriod: "MONTH",
    bedrooms: 2,
    bathrooms: 1,
    region: "Ashanti",
    city: "Kumasi",
    area: "Ahodwo",
    address: "Near Ahodwo Roundabout, off the Harper Road",
    latitude: 6.67,
    longitude: -1.62,
    amenities: ["Parking Space", "Prepaid Meter (ECG)", "Security / Watchman", "Tiled Floors", "Walled & Gated", "Water Reservoir / Polytank"],
    status: "APPROVED",
    images: ["1484154218962-a197022b5858", "1522708323590-d24dbb6b0267"],
  },
  {
    owner: "agent1",
    title: "Chamber and Hall at Asafo, Kumasi",
    description:
      "Affordable chamber and hall in a shared compound house at Asafo, walking distance to the Asafo market and lorry park. Shared bathroom and toilet, separate prepaid meter. Good for a student or single worker.",
    type: "ROOM",
    listingType: "RENT",
    price: 500,
    pricePeriod: "MONTH",
    bedrooms: 1,
    bathrooms: 1,
    region: "Ashanti",
    city: "Kumasi",
    area: "Asafo",
    address: "Behind Asafo Market",
    latitude: 6.685,
    longitude: -1.612,
    amenities: ["Prepaid Meter (ECG)", "Tarred Road Access"],
    status: "RENTED_OR_SOLD",
    images: ["1502672260266-1c1ef2d93688", "1536376072261-38c75010e6c9"],
  },
  {
    owner: "agent2",
    title: "Student Hostel Rooms near KNUST, Ayeduase",
    description:
      "Shared hostel rooms (2 and 4 in a room options) just 5 minutes from the KNUST Ayeduase gate. Price shown is per bed, per academic year. Includes a study room, Wi-Fi, and a standby generator for exam periods. Book early — rooms finish fast every semester.",
    type: "HOSTEL",
    listingType: "RENT",
    price: 4800,
    pricePeriod: "YEAR",
    bedrooms: 1,
    bathrooms: 1,
    region: "Ashanti",
    city: "Kumasi",
    area: "Ayeduase",
    address: "Ayeduase New Site, near KNUST Ayeduase Gate",
    latitude: 6.677,
    longitude: -1.557,
    amenities: ["Backup Generator", "CCTV Security", "Security / Watchman", "Self-Contained", "Study Room", "Wardrobes", "Wi-Fi Ready"],
    status: "APPROVED",
    images: ["1595576508898-0ad5c879a061", "1505693416388-ac5ce068fe85"],
  },
  {
    owner: "agent1",
    title: "3 Bedroom House at Anaji, Takoradi",
    description:
      "Clean 3 bedroom house in the fast-growing Anaji area of Takoradi. Large compound with space for 3 cars, all rooms tiled with wardrobes. About 10 minutes' drive to the Takoradi Mall and the harbour.",
    type: "HOUSE",
    listingType: "RENT",
    price: 2200,
    pricePeriod: "MONTH",
    bedrooms: 3,
    bathrooms: 2,
    region: "Western",
    city: "Sekondi-Takoradi",
    area: "Anaji",
    address: "Anaji Estate, off the Kansaworodo road",
    latitude: 4.912,
    longitude: -1.77,
    amenities: ["Borehole Water", "Parking Space", "Prepaid Meter (ECG)", "Tarred Road Access", "Tiled Floors", "Walled & Gated", "Wardrobes"],
    status: "APPROVED",
    images: ["1570129477492-45c003edd2be", "1583608205776-bfd35f0d9f83", "1449844908441-8829872d2607"],
  },
  {
    owner: "agent2",
    title: "Titled Plot of Land at Oyibi (70 x 100 ft)",
    description:
      "One full plot (70 x 100 ft) at Oyibi, in a fast-developing residential layout with many new houses springing up. The land is fully registered with indenture and site plan — no litigation, no double-sale issues. Corner pillars already fixed. Serious buyers only, please.",
    type: "LAND",
    listingType: "SALE",
    price: 180000,
    pricePeriod: "ONE_OFF",
    bedrooms: null,
    bathrooms: null,
    region: "Greater Accra",
    city: "Accra",
    area: "Oyibi",
    address: "Oyibi, off the Dodowa road",
    latitude: 5.8097,
    longitude: 0.0072,
    amenities: ["Tarred Road Access"],
    status: "APPROVED",
    images: ["1500382017468-9049fed747ef", "1472214103451-9374bd1c798e"],
  },
  {
    owner: "agent2",
    title: "2 Bedroom Apartment near UCC, Cape Coast",
    description:
      "Quiet 2 bedroom apartment near the University of Cape Coast (UCC) — ideal for lecturers, postgraduate students, or a small family. The area is calm and safe, with a sea breeze most evenings. Monthly payment accepted.",
    type: "APARTMENT",
    listingType: "RENT",
    price: 1200,
    pricePeriod: "MONTH",
    bedrooms: 2,
    bathrooms: 1,
    region: "Central",
    city: "Cape Coast",
    area: "University of Cape Coast Area",
    address: "Near UCC Science Market, Amamoma",
    latitude: 5.114,
    longitude: -1.288,
    amenities: ["Prepaid Meter (ECG)", "Tarred Road Access", "Tiled Floors", "Water Reservoir / Polytank"],
    status: "APPROVED",
    images: ["1560448204-e02f11c3d0e2", "1484154218962-a197022b5858"],
  },
  {
    owner: "agent1",
    title: "5 Bedroom House for Sale in Sunyani",
    description:
      "Solid 5 bedroom family house in Sunyani (Berlin Top area) on two plots of land. Big living room, dining area and a store room. The house needs light renovation on the paintwork, and the price reflects that. All documents available.",
    type: "HOUSE",
    listingType: "SALE",
    price: 950000,
    pricePeriod: "ONE_OFF",
    bedrooms: 5,
    bathrooms: 3,
    region: "Bono",
    city: "Sunyani",
    area: "Berlin Top",
    address: "Berlin Top, off the Sunyani–Kumasi road",
    latitude: 7.34,
    longitude: -2.33,
    amenities: ["Boys Quarters", "Parking Space", "Store Room", "Tiled Floors", "Walled & Gated", "Water Reservoir / Polytank"],
    status: "APPROVED",
    images: ["1580587771525-78b9dba3b914", "1564013799919-ab600027ffc6"],
  },
  {
    owner: "agent2",
    title: "Commercial Shop Space near Kejetia Market",
    description:
      "Busy shop space (about 25 sqm) facing the road near Kejetia Market, Kumasi — heavy foot traffic all day. Suitable for provisions, cosmetics, phone accessories, or a small boutique. Rent is two years advance.",
    type: "COMMERCIAL",
    listingType: "RENT",
    price: 2500,
    pricePeriod: "MONTH",
    bedrooms: null,
    bathrooms: 1,
    region: "Ashanti",
    city: "Kumasi",
    area: "Kejetia",
    address: "Near Kejetia Market, Dr. Mensah area",
    latitude: 6.6973,
    longitude: -1.624,
    amenities: ["Prepaid Meter (ECG)", "Store Room", "Tarred Road Access"],
    status: "APPROVED",
    images: ["1441986300917-64674bd600d8", "1567401893414-76b7b1e5a7a5"],
  },
  {
    owner: "agent1",
    title: "1 Bedroom Apartment in Ho",
    description:
      "Simple 1 bedroom apartment in a quiet neighbourhood in Ho, close to the Ho Teaching Hospital. Suitable for a nurse, teacher, or national service personnel.",
    type: "APARTMENT",
    listingType: "RENT",
    price: 700,
    pricePeriod: "MONTH",
    bedrooms: 1,
    bathrooms: 1,
    region: "Volta",
    city: "Ho",
    area: "Trafalgar Area",
    address: "Near Ho Teaching Hospital",
    latitude: 6.61,
    longitude: 0.475,
    amenities: ["Prepaid Meter (ECG)", "Self-Contained", "Tarred Road Access"],
    status: "REJECTED",
    rejectionReason:
      "Photos are too blurry to verify the property. Please upload clearer photos, including one of the bathroom, and resubmit.",
    images: ["1502672260266-1c1ef2d93688"],
  },
  {
    owner: "agent2",
    title: "3 Bedroom House in Tamale",
    description:
      "Newly built 3 bedroom house at Sagnarigu, Tamale, with a big compound and borehole water supply. All rooms are tiled and the house is fully walled. About 15 minutes from the Tamale city centre.",
    type: "HOUSE",
    listingType: "RENT",
    price: 1500,
    pricePeriod: "MONTH",
    bedrooms: 3,
    bathrooms: 2,
    region: "Northern",
    city: "Tamale",
    area: "Sagnarigu",
    address: "Sagnarigu, off the Kumbungu road",
    latitude: 9.41,
    longitude: -0.845,
    amenities: ["Borehole Water", "Parking Space", "POP Ceiling", "Prepaid Meter (ECG)", "Tiled Floors", "Walled & Gated"],
    status: "PENDING",
    images: ["1568605114967-8130f3a36994", "1570129477492-45c003edd2be"],
  },
  {
    owner: "agent1",
    title: "Studio Apartment in Koforidua",
    description:
      "Compact studio apartment in Koforidua, about 10 minutes from the Jackson Park area. Self-contained with a small kitchenette — a good starter home for a single person or a young couple.",
    type: "APARTMENT",
    listingType: "RENT",
    price: 450,
    pricePeriod: "MONTH",
    bedrooms: 1,
    bathrooms: 1,
    region: "Eastern",
    city: "Koforidua",
    area: "Effiduase",
    address: "Effiduase, near the Koforidua Technical University",
    latitude: 6.09,
    longitude: -0.265,
    amenities: ["Prepaid Meter (ECG)", "Self-Contained", "Tiled Floors"],
    status: "PENDING",
    images: ["1536376072261-38c75010e6c9", "1505693416388-ac5ce068fe85"],
  },
];

async function main() {
  console.log("Seeding RentGH development data…");
  const passwordHash = await bcrypt.hash("Password123!", 12);

  // ── Users (upserted by email so reseeding is safe) ──────────────────────
  const [admin, agent1, agent2, tenant] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@rentgh.com" },
      update: {},
      create: {
        name: "Akosua Owusu",
        email: "admin@rentgh.com",
        phone: "+233201112233",
        passwordHash,
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "kwame.mensah@rentgh.com" },
      update: {},
      create: {
        name: "Kwame Mensah",
        email: "kwame.mensah@rentgh.com",
        phone: "+233241234567",
        passwordHash,
        role: "AGENT",
      },
    }),
    prisma.user.upsert({
      where: { email: "ama.serwaa@rentgh.com" },
      update: {},
      create: {
        name: "Ama Serwaa",
        email: "ama.serwaa@rentgh.com",
        phone: "+233277654321",
        passwordHash,
        role: "AGENT",
      },
    }),
    prisma.user.upsert({
      where: { email: "yaw.danso@gmail.com" },
      update: {},
      create: {
        name: "Yaw Danso",
        email: "yaw.danso@gmail.com",
        phone: "+233559876543",
        passwordHash,
        role: "TENANT",
      },
    }),
  ]);

  const owners = { agent1: agent1.id, agent2: agent2.id };

  // ── Properties (recreated each run for idempotency) ─────────────────────
  await prisma.property.deleteMany({
    where: { ownerId: { in: [agent1.id, agent2.id] } },
  });

  for (const p of PROPERTIES) {
    const { owner, images, ...data } = p;
    await prisma.property.create({
      data: {
        ...data,
        ownerId: owners[owner],
        images: {
          create: images.map((id, i) => ({ url: img(id), order: i })),
        },
      },
    });
  }

  const byStatus = await prisma.property.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log(
    `Seeded users: admin=${admin.email}, agents=${agent1.email}, ${agent2.email}, tenant=${tenant.email}`
  );
  console.log(
    "Properties by status:",
    byStatus.map((s) => `${s.status}=${s._count}`).join(", ")
  );
  console.log("Done. All seed passwords: Password123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
