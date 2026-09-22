--
-- PostgreSQL database cluster dump
--

\restrict ekw3sXGTaJ5UApvSEwUINUDWs6Q2pBVWnskE6bploAKXpkkMqVeg5z6yc7XagUX

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE rentflow;
ALTER ROLE rentflow WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:UgMXeE7DzAgWW2hrj4aUGA==$zG3hu8WyU/9mvulP7E9d9yDXpSo7VI+hBdN/kWb2Bek=:/rEZMznt9cFLkAW2gWHp8vSIwkmfs+uSwzLT/U734aw=';

--
-- User Configurations
--








\unrestrict ekw3sXGTaJ5UApvSEwUINUDWs6Q2pBVWnskE6bploAKXpkkMqVeg5z6yc7XagUX

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict 78G5XZ2dITBRxD2ZcyQcRxGBq1EvIVI0NPQN3R0mBvTsMXgyVjckJLgSk9U2m6t

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict 78G5XZ2dITBRxD2ZcyQcRxGBq1EvIVI0NPQN3R0mBvTsMXgyVjckJLgSk9U2m6t

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict RMZRl9zmq7GGeagYyJpZWFv8gQDbBmNggXAdbutjQVoRPbhFn04iqyrI6rleBxQ

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict RMZRl9zmq7GGeagYyJpZWFv8gQDbBmNggXAdbutjQVoRPbhFn04iqyrI6rleBxQ

--
-- Database "rentflow" dump
--

--
-- PostgreSQL database dump
--

\restrict R0qFpEVz03TkHA4EtAK73hK3FRJP1syC8LsoPiv2ud84rmnbFKErRCiBlnOiBdp

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rentflow; Type: DATABASE; Schema: -; Owner: rentflow
--

CREATE DATABASE rentflow WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rentflow OWNER TO rentflow;

\unrestrict R0qFpEVz03TkHA4EtAK73hK3FRJP1syC8LsoPiv2ud84rmnbFKErRCiBlnOiBdp
\connect rentflow
\restrict R0qFpEVz03TkHA4EtAK73hK3FRJP1syC8LsoPiv2ud84rmnbFKErRCiBlnOiBdp

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AnnouncementType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."AnnouncementType" AS ENUM (
    'NORMAL',
    'IMPORTANT',
    'URGENT'
);


ALTER TYPE public."AnnouncementType" OWNER TO rentflow;

--
-- Name: BillItemType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."BillItemType" AS ENUM (
    'CHARGE',
    'DISCOUNT'
);


ALTER TYPE public."BillItemType" OWNER TO rentflow;

--
-- Name: BillStatus; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."BillStatus" AS ENUM (
    'PENDING',
    'WAITING_FOR_VERIFICATION',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);


ALTER TYPE public."BillStatus" OWNER TO rentflow;

--
-- Name: FileCategory; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."FileCategory" AS ENUM (
    'DORMITORY',
    'ROOM',
    'PAYMENT_SLIP',
    'MAINTENANCE',
    'ANNOUNCEMENT'
);


ALTER TYPE public."FileCategory" OWNER TO rentflow;

--
-- Name: LandmarkType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."LandmarkType" AS ENUM (
    'UNIVERSITY',
    'SCHOOL',
    'HOSPITAL',
    'SHOPPING_MALL',
    'ARL',
    'OFFICE',
    'MARKET',
    'OTHER'
);


ALTER TYPE public."LandmarkType" OWNER TO rentflow;

--
-- Name: LineType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."LineType" AS ENUM (
    'PERSONAL',
    'OFFICIAL'
);


ALTER TYPE public."LineType" OWNER TO rentflow;

--
-- Name: MaintenanceStatus; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."MaintenanceStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."MaintenanceStatus" OWNER TO rentflow;

--
-- Name: OwnerStatus; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."OwnerStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'SUSPENDED'
);


ALTER TYPE public."OwnerStatus" OWNER TO rentflow;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'TRANSFER'
);


ALTER TYPE public."PaymentMethod" OWNER TO rentflow;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'WAITING_VERIFY',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public."PaymentStatus" OWNER TO rentflow;

--
-- Name: PromptPayType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."PromptPayType" AS ENUM (
    'PHONE',
    'ID_CARD',
    'E_WALLET'
);


ALTER TYPE public."PromptPayType" OWNER TO rentflow;

--
-- Name: RoomStatus; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."RoomStatus" AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'MAINTENANCE',
    'DISABLED'
);


ALTER TYPE public."RoomStatus" OWNER TO rentflow;

--
-- Name: RoomType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."RoomType" AS ENUM (
    'AIR',
    'FAN'
);


ALTER TYPE public."RoomType" OWNER TO rentflow;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."Status" AS ENUM (
    'PENDING',
    'ACTIVE',
    'BANNED',
    'INACTIVE'
);


ALTER TYPE public."Status" OWNER TO rentflow;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'OWNER',
    'TENANT'
);


ALTER TYPE public."UserRole" OWNER TO rentflow;

--
-- Name: WaterBillingType; Type: TYPE; Schema: public; Owner: rentflow
--

CREATE TYPE public."WaterBillingType" AS ENUM (
    'METERED',
    'FLAT_RATE'
);


ALTER TYPE public."WaterBillingType" OWNER TO rentflow;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type public."AnnouncementType" DEFAULT 'NORMAL'::public."AnnouncementType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isEmailSent" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Announcement" OWNER TO rentflow;

--
-- Name: AnnouncementReadLog; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."AnnouncementReadLog" (
    id text NOT NULL,
    "announcementId" text NOT NULL,
    "tenantId" text NOT NULL,
    "readAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AnnouncementReadLog" OWNER TO rentflow;

--
-- Name: Bill; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Bill" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "tenantId" text NOT NULL,
    "tenantNameSnapshot" text NOT NULL,
    "roomNumberSnapshot" text NOT NULL,
    "roomPriceSnapshot" double precision NOT NULL,
    "billingMonth" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "waterBillingTypeSnapshot" public."WaterBillingType" DEFAULT 'METERED'::public."WaterBillingType" NOT NULL,
    "prevWaterUnitSnapshot" double precision NOT NULL,
    "currentWaterUnitSnapshot" double precision NOT NULL,
    "waterUsedSnapshot" double precision NOT NULL,
    "waterRateSnapshot" double precision NOT NULL,
    "waterFeeSnapshot" double precision NOT NULL,
    "prevElectricUnitSnapshot" double precision NOT NULL,
    "currentElectricUnitSnapshot" double precision NOT NULL,
    "electricUsedSnapshot" double precision NOT NULL,
    "electricRateSnapshot" double precision NOT NULL,
    "electricFeeSnapshot" double precision NOT NULL,
    "waterImageKey" text,
    "electricImageKey" text,
    "commonFeeSnapshot" double precision NOT NULL,
    "lateFeeSnapshot" double precision NOT NULL,
    total double precision NOT NULL,
    note text,
    status public."BillStatus" DEFAULT 'PENDING'::public."BillStatus" NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastNotifiedAt" timestamp(3) without time zone,
    "reminderSentAt" timestamp(3) without time zone
);


ALTER TABLE public."Bill" OWNER TO rentflow;

--
-- Name: BillDraft; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."BillDraft" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    name text NOT NULL,
    "selectedDate" timestamp(3) without time zone NOT NULL,
    items jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BillDraft" OWNER TO rentflow;

--
-- Name: BillItem; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."BillItem" (
    id text NOT NULL,
    "billId" text NOT NULL,
    name text NOT NULL,
    amount double precision NOT NULL,
    type public."BillItemType" DEFAULT 'CHARGE'::public."BillItemType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BillItem" OWNER TO rentflow;

--
-- Name: Dormitory; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Dormitory" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description jsonb,
    address text NOT NULL,
    "lineId" text,
    "lineType" public."LineType" DEFAULT 'PERSONAL'::public."LineType" NOT NULL,
    facebook text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "mapUrl" text NOT NULL,
    status public."Status" DEFAULT 'PENDING'::public."Status" NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "featuredOrder" integer,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Dormitory" OWNER TO rentflow;

--
-- Name: DormitoryContact; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."DormitoryContact" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    name text,
    phone text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DormitoryContact" OWNER TO rentflow;

--
-- Name: DormitorySetting; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."DormitorySetting" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    "roomPrice" double precision,
    "waterBillingType" public."WaterBillingType" DEFAULT 'METERED'::public."WaterBillingType" NOT NULL,
    "waterRate" double precision NOT NULL,
    "electricRate" double precision NOT NULL,
    "commonFee" double precision DEFAULT 0 NOT NULL,
    "lateFee" double precision DEFAULT 0 NOT NULL,
    "dueDay" integer NOT NULL,
    "dueMonthOffset" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."DormitorySetting" OWNER TO rentflow;

--
-- Name: Feature; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Feature" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Feature" OWNER TO rentflow;

--
-- Name: File; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."File" (
    id text NOT NULL,
    "tenantId" text,
    "ownerId" text,
    bucket text NOT NULL,
    "dormitoryId" text,
    "roomId" text,
    "paymentId" text,
    "maintenanceId" text,
    category public."FileCategory" NOT NULL,
    "objectKey" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    "order" integer,
    "isCover" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "announcementId" text
);


ALTER TABLE public."File" OWNER TO rentflow;

--
-- Name: Landmark; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Landmark" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type public."LandmarkType" NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "mapUrl" text NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Landmark" OWNER TO rentflow;

--
-- Name: MaintenanceMessage; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."MaintenanceMessage" (
    id text NOT NULL,
    "maintenanceId" text NOT NULL,
    "senderRole" public."UserRole" NOT NULL,
    "senderId" text NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "editedAt" timestamp(3) without time zone
);


ALTER TABLE public."MaintenanceMessage" OWNER TO rentflow;

--
-- Name: MaintenanceRequest; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."MaintenanceRequest" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    "roomId" text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."MaintenanceStatus" DEFAULT 'OPEN'::public."MaintenanceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ownerNote" text
);


ALTER TABLE public."MaintenanceRequest" OWNER TO rentflow;

--
-- Name: OwnerProfile; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."OwnerProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status public."OwnerStatus" DEFAULT 'PENDING'::public."OwnerStatus" NOT NULL,
    "fullName" text NOT NULL,
    "lineId" text,
    phone text,
    facebook text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OwnerProfile" OWNER TO rentflow;

--
-- Name: PasswordResetOtp; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."PasswordResetOtp" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "otpHash" text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "consumedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetOtp" OWNER TO rentflow;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "billId" text NOT NULL,
    status public."PaymentStatus" DEFAULT 'WAITING_VERIFY'::public."PaymentStatus" NOT NULL,
    "verifiedBy" text,
    "verifiedAt" timestamp(3) without time zone,
    "paymentMethod" public."PaymentMethod",
    "transferRef" text,
    "transferAmount" double precision,
    "transferBank" text,
    "senderName" text,
    "paidAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO rentflow;

--
-- Name: PaymentSetting; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."PaymentSetting" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    "promptPayType" public."PromptPayType",
    "promptPayValue" text,
    "bankName" text,
    "bankAccount" text,
    "bankHolder" text,
    "promptPayHolder" text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."PaymentSetting" OWNER TO rentflow;

--
-- Name: Room; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    "dormitoryId" text NOT NULL,
    "roomNumber" text NOT NULL,
    floor integer NOT NULL,
    type public."RoomType",
    description text,
    "basePrice" double precision NOT NULL,
    status public."RoomStatus" DEFAULT 'AVAILABLE'::public."RoomStatus" NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Room" OWNER TO rentflow;

--
-- Name: RoomMeterSetting; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."RoomMeterSetting" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "electricMeterDigits" integer DEFAULT 5 NOT NULL,
    "waterMeterDigits" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RoomMeterSetting" OWNER TO rentflow;

--
-- Name: RoomQrAuth; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."RoomQrAuth" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    token text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RoomQrAuth" OWNER TO rentflow;

--
-- Name: TenantProfile; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."TenantProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roomId" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    email text,
    "idCard" text,
    address text,
    "numberOfResidents" integer DEFAULT 1 NOT NULL,
    "tenantNameSnapshot" text,
    "securityDeposit" double precision DEFAULT 0 NOT NULL,
    "advancePayment" double precision DEFAULT 0 NOT NULL,
    "entranceFee" double precision DEFAULT 0 NOT NULL,
    "contractStartDate" timestamp(3) without time zone,
    "contractEndDate" timestamp(3) without time zone,
    "moveInDate" timestamp(3) without time zone,
    "moveOutDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    notes text,
    "emergencyContactName" text,
    "emergencyContactPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TenantProfile" OWNER TO rentflow;

--
-- Name: User; Type: TABLE; Schema: public; Owner: rentflow
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    status public."Status" DEFAULT 'PENDING'::public."Status" NOT NULL,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO rentflow;

--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Announcement" (id, "dormitoryId", title, content, type, "isActive", "isEmailSent", "order", "isPinned", "createdAt", "updatedAt") FROM stdin;
6eaaf264-a2a6-4362-8daf-26d1f653eef7	19f1999b-da0e-454d-ad0c-87cdcd8c042e	ล้างแอร์จ้าา	เข้าเข้าทำการล้างวันอาทิตย์ที่01/11/69 นะครับ	URGENT	t	t	0	f	2026-08-02 16:39:54.372	2026-08-04 06:23:13.542
\.


--
-- Data for Name: AnnouncementReadLog; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."AnnouncementReadLog" (id, "announcementId", "tenantId", "readAt") FROM stdin;
356f8b6e-ef10-4736-9912-514506ee8b22	6eaaf264-a2a6-4362-8daf-26d1f653eef7	eeb709d0-e3d3-4fd3-9fc3-144e639deaf0	2026-08-04 06:20:33.787
\.


--
-- Data for Name: Bill; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Bill" (id, "roomId", "tenantId", "tenantNameSnapshot", "roomNumberSnapshot", "roomPriceSnapshot", "billingMonth", "dueDate", "waterBillingTypeSnapshot", "prevWaterUnitSnapshot", "currentWaterUnitSnapshot", "waterUsedSnapshot", "waterRateSnapshot", "waterFeeSnapshot", "prevElectricUnitSnapshot", "currentElectricUnitSnapshot", "electricUsedSnapshot", "electricRateSnapshot", "electricFeeSnapshot", "waterImageKey", "electricImageKey", "commonFeeSnapshot", "lateFeeSnapshot", total, note, status, archived, "createdAt", "lastNotifiedAt", "reminderSentAt") FROM stdin;
20623a9f-5f58-41e0-b7c9-d57b708a50a0	90728cf4-3957-4061-b9a5-f5b25d1c1e96	eeb709d0-e3d3-4fd3-9fc3-144e639deaf0	เอกภพ หล่อเลย	A1	2800	2026-06-01 00:00:00	2026-07-05 00:00:00	FLAT_RATE	0	0	0	200	200	0	1	1	10	10	\N	\N	0	1500	4510	\N	OVERDUE	f	2026-08-02 16:28:36.614	2026-08-02 16:28:49.454	\N
a642a716-687f-4880-b287-ef846a8a18ec	90728cf4-3957-4061-b9a5-f5b25d1c1e96	eeb709d0-e3d3-4fd3-9fc3-144e639deaf0	เอกภพ หล่อเลย	A1	2800	2026-08-01 00:00:00	2026-09-05 00:00:00	FLAT_RATE	0	0	0	200	200	0	1	1	10	10	\N	\N	0	0	3010	\N	CANCELLED	f	2026-08-02 16:04:05.72	2026-08-02 16:04:18.328	\N
e2e1d448-e126-46b4-8f11-01605fab8854	9c9eec57-1705-47aa-b106-5f148a673107	d3052028-4cfa-42e9-ae7d-d2cc09432d74	สักชัย อร่อยดี	A2	2800	2026-07-01 00:00:00	2026-08-05 00:00:00	FLAT_RATE	0	0	0	200	200	0	1	1	10	10	\N	\N	0	0	3010	\N	PAID	f	2026-08-02 16:17:53.565	2026-08-02 16:18:22.728	2026-08-04 01:00:00.116
379f9420-b1b7-4052-a066-550a0c881f83	36270146-fca1-4572-ad24-c8a4470e5195	2bc9c91a-6efe-4fb1-bacd-d256aa55a77f	จัสติน อลาบา	101	3000	2026-08-01 00:00:00	2026-09-01 00:00:00	FLAT_RATE	0	0	0	100	100	0	1	1	10	10	\N	\N	0	50	3110	\N	PAID	f	2026-08-02 16:37:54.153	2026-08-02 16:37:57.447	\N
\.


--
-- Data for Name: BillDraft; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."BillDraft" (id, "dormitoryId", name, "selectedDate", items, "createdAt", "updatedAt") FROM stdin;
f16330ae-aa32-4475-841c-bc7ca2a95ea7	19f1999b-da0e-454d-ad0c-87cdcd8c042e	1	2026-08-02 16:05:39.78	[{"id": "325cf43f-b813-4af5-ae56-82550e6ee9b7", "roomId": "9c9eec57-1705-47aa-b106-5f148a673107", "commonFee": 0, "prevWater": 0, "roomNumber": "A2", "tenantName": "สักชัย อร่อยดี", "currentWater": "", "prevElectric": 0, "isPrevEditable": true, "currentElectric": "1", "waterMeterDigits": null}]	2026-08-02 16:06:05.237	2026-08-02 16:06:05.237
\.


--
-- Data for Name: BillItem; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."BillItem" (id, "billId", name, amount, type, "createdAt") FROM stdin;
\.


--
-- Data for Name: Dormitory; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Dormitory" (id, "ownerId", name, slug, description, address, "lineId", "lineType", facebook, latitude, longitude, "mapUrl", status, "isPublished", "isFeatured", "featuredOrder", "deletedAt", "createdAt", "updatedAt") FROM stdin;
693057e6-2d93-406d-862f-749905999fa7	439e1b14-dde8-40f7-a78d-5f2b2711feeb	คอนโด พีค	คอนโด-พีค	{"sections": [{"id": "daa5b965-3764-4013-b7e7-ca6ca8d5ff9b", "type": "text", "order": 1, "value": "พิกัด มอราช  ใกล้มอเก่า"}]}	55/55	@youuiii	OFFICIAL	\N	16.1972824	103.280419	https://maps.app.goo.gl/TxW6DJGqH3uDGoaw9	ACTIVE	t	f	\N	\N	2026-08-02 15:26:26.383	2026-08-02 15:50:25.144
914825e2-daa7-4b83-9ccd-b9a5ea52078b	05450fcb-422f-4e62-be1d-dd85d987b425	The Rich	the-rich	{"sections": [{"id": "510cb10a-53ab-4a12-a677-1c36f6d8eea8", "type": "text", "order": 1, "value": "# 🏨 โรงแรม The Rich"}, {"id": "aa860210-ec63-4ffd-8c19-6d6396467a5f", "type": "text", "order": 2, "value": "**ที่พักรายเดือนคุณภาพ พร้อมเข้าอยู่ บรรยากาศเงียบสงบ สะอาด ปลอดภัย เดินทางสะดวก**"}, {"id": "49d3df17-a2cc-4df8-89ca-79725082d874", "type": "text", "order": 3, "value": "หากคุณกำลังมองหาที่พักรายเดือนที่ให้ทั้งความสะดวกสบาย ความปลอดภัย และความคุ้มค่า **โรงแรม The Rich** คืออีกหนึ่งตัวเลือกที่ตอบโจทย์ทั้งนักศึกษา พนักงานออฟฟิศ บุคลากรของหน่วยงานต่าง ๆ และผู้ที่ต้องการพักอาศัยระยะยาว"}, {"id": "56499f39-7146-4577-a2a7-327a2b70e47a", "type": "text", "order": 4, "value": "เราให้ความสำคัญกับคุณภาพการอยู่อาศัย เพื่อให้ทุกวันของคุณเต็มไปด้วยความสะดวกสบาย ไม่ว่าจะเป็นการพักผ่อนหลังเลิกงาน การเรียน หรือการใช้ชีวิตประจำวัน คุณจะได้สัมผัสบรรยากาศที่เงียบสงบ เป็นส่วนตัว และเหมาะสำหรับการพักอาศัยอย่างแท้จริง"}, {"id": "71a889f8-9038-47c1-99f6-e12e23f6057a", "type": "text", "order": 5, "value": "---"}, {"id": "f30a73da-b01b-4815-a89d-39ff0f3643ba", "type": "text", "order": 6, "value": "## ✨ จุดเด่นของที่พัก"}, {"id": "915ab0e5-48e7-4375-a505-b2aac98d690a", "type": "text", "order": 7, "value": "* ห้องพักสะอาด โปร่ง โล่ง อยู่สบาย"}, {"id": "52fd5c01-6669-49a9-9631-cad185b0aeca", "type": "text", "order": 8, "value": "* พร้อมเฟอร์นิเจอร์ครบ เข้าอยู่ได้ทันที"}, {"id": "f1f84569-57fb-4bf5-a829-b042eca6ddfb", "type": "text", "order": 9, "value": "* เตียงนอนคุณภาพ พร้อมที่นอน"}, {"id": "58a620aa-3460-4a3d-a9c7-fa1798ce3eb5", "type": "text", "order": 10, "value": "* ตู้เสื้อผ้า โต๊ะทำงาน และเก้าอี้"}, {"id": "f80197e8-2635-4db8-b3d5-0c80eab2e890", "type": "text", "order": 11, "value": "* เครื่องปรับอากาศ"}, {"id": "4158c607-d58b-46bd-9d20-70e782d9a8e8", "type": "text", "order": 12, "value": "* โทรทัศน์"}, {"id": "823e4c34-3b59-4211-96d1-9fb7e54819d7", "type": "text", "order": 13, "value": "* ตู้เย็น"}, {"id": "a99a9d3c-7227-41e8-ae1a-55edc9b4fc52", "type": "text", "order": 14, "value": "* เครื่องทำน้ำอุ่น"}, {"id": "97c16435-8042-417e-b656-73984bb730eb", "type": "text", "order": 15, "value": "* อินเทอร์เน็ต Wi-Fi ความเร็วสูง"}, {"id": "ace494a6-882a-4c07-9b80-3d9ddf5cdf64", "type": "text", "order": 16, "value": "* ระบบรักษาความปลอดภัยตลอด 24 ชั่วโมง"}, {"id": "2ea0f88c-5b8d-4e96-ba56-5ab7fe09813a", "type": "text", "order": 17, "value": "* กล้องวงจรปิด (CCTV)"}, {"id": "8775019f-7b1d-4afa-ab7e-7e4511cecf2c", "type": "text", "order": 18, "value": "* ที่จอดรถสะดวก"}, {"id": "ee6284d7-f5d9-4d92-8452-7ea2eff9284f", "type": "text", "order": 19, "value": "* บรรยากาศเงียบสงบ เหมาะสำหรับการพักผ่อน"}, {"id": "96c0bfc8-749b-4145-9de2-6ceff9361d39", "type": "text", "order": 20, "value": "---"}, {"id": "2ebe075a-b22d-46fd-9776-b23d2c9a1f48", "type": "text", "order": 21, "value": "## 📍 ทำเลดี เดินทางสะดวก"}, {"id": "740e5b7b-6812-4ded-8629-dc585938a8eb", "type": "text", "order": 22, "value": "โรงแรม The Rich ตั้งอยู่ในทำเลที่เดินทางได้สะดวก ใกล้แหล่งชุมชน ร้านสะดวกซื้อ ร้านอาหาร ร้านกาแฟ และสถานที่สำคัญหลายแห่ง ช่วยให้การใช้ชีวิตประจำวันของคุณง่ายขึ้น ไม่ว่าจะเดินทางไปเรียน ไปทำงาน หรือทำธุระต่าง ๆ ก็สามารถเดินทางได้อย่างรวดเร็ว"}, {"id": "8b49759f-f91f-4066-946b-d64c99316af7", "type": "text", "order": 23, "value": "บริเวณโดยรอบยังมีสิ่งอำนวยความสะดวกครบครัน ทั้งร้านอาหารตามสั่ง คาเฟ่ ร้านซักรีด ร้านขายยา ร้านสะดวกซื้อ และบริการขนส่งสาธารณะ ทำให้คุณใช้ชีวิตได้อย่างสะดวกโดยไม่ต้องเดินทางไกล"}, {"id": "d47830c9-d5df-4d9a-ba03-b1e1fe635105", "type": "text", "order": 24, "value": "---"}, {"id": "40e3da04-8892-45e8-bf7b-ecddae1f93ce", "type": "text", "order": 25, "value": "## 🏠 ห้องพักที่ออกแบบเพื่อการอยู่อาศัย"}, {"id": "0ecd7aa2-71c1-42a7-a9f4-6b00b009a15e", "type": "text", "order": 26, "value": "ทุกห้องได้รับการดูแลเป็นอย่างดี เน้นความสะอาด ความเป็นระเบียบ และความสะดวกในการใช้งาน ภายในห้องมีพื้นที่ใช้สอยที่เหมาะสม โปร่งสบาย อากาศถ่ายเทดี ให้ความรู้สึกผ่อนคลาย เหมาะสำหรับทั้งการพักผ่อน การทำงาน และการเรียน"}, {"id": "c0d802ee-62c5-457c-9f42-3748c3b2b47b", "type": "text", "order": 27, "value": "ไม่ว่าคุณจะพักอาศัยเพียงคนเดียว หรือพักเป็นคู่ โรงแรม The Rich พร้อมมอบบรรยากาศที่อบอุ่นและเป็นส่วนตัว เพื่อให้คุณรู้สึกเหมือนอยู่บ้าน"}, {"id": "fd40a248-86fd-42e5-a8b9-215defad86bc", "type": "text", "order": 28, "value": "---"}, {"id": "674d3829-3e9e-4d0e-af4d-dc28b1f323d8", "type": "text", "order": 29, "value": "## 🛡️ ความปลอดภัยที่ใส่ใจ"}, {"id": "a05854db-e673-4d02-bf07-130157329ea5", "type": "text", "order": 30, "value": "เราให้ความสำคัญกับความปลอดภัยของผู้พักอาศัยเป็นอันดับต้น ๆ ด้วยระบบรักษาความปลอดภัยที่ได้มาตรฐาน พร้อมกล้องวงจรปิดในพื้นที่ส่วนกลาง และการดูแลพื้นที่อย่างสม่ำเสมอ เพื่อให้ผู้พักอาศัยสามารถใช้ชีวิตได้อย่างมั่นใจตลอดเวลา"}, {"id": "fe62844c-5241-443c-a2e1-21328cf0f4dc", "type": "text", "order": 31, "value": "---"}, {"id": "60705afa-8dd3-4f63-a0df-edad5852d2d4", "type": "text", "order": 32, "value": "## 💙 เหมาะสำหรับ"}, {"id": "6308d98b-c3a8-42e5-be6f-2747e39ea44e", "type": "text", "order": 33, "value": "* นักศึกษา"}, {"id": "d51fa9ab-bcb3-4f2c-8ed5-35ffe7838dc6", "type": "text", "order": 34, "value": "* พนักงานบริษัท"}, {"id": "694984ff-2965-4b2a-8750-5953cc81347d", "type": "text", "order": 35, "value": "* ข้าราชการ"}, {"id": "4c0139ce-90e6-467d-afd1-de389d2fcc9b", "type": "text", "order": 36, "value": "* บุคลากรโรงพยาบาล"}, {"id": "431a1d51-cc02-40f9-8bd0-bc8545f1894b", "type": "text", "order": 37, "value": "* ผู้ที่ย้ายมาทำงาน"}, {"id": "08d0b845-856f-4244-8f4d-acae91c7040e", "type": "text", "order": 38, "value": "* ผู้ที่กำลังมองหาที่พักรายเดือนคุณภาพ"}, {"id": "641e6b1a-96d3-4775-84ce-7c0238c75eee", "type": "text", "order": 39, "value": "* ผู้ที่ต้องการที่พักสะอาด ปลอดภัย และเดินทางสะดวก"}, {"id": "3a4ffa5d-a620-4af5-86ec-8cc3b77bf61d", "type": "text", "order": 40, "value": "---"}, {"id": "cbe51b69-8617-4313-8b99-92933cd6a74b", "type": "text", "order": 41, "value": "## 🌟 ทำไมต้องเลือกโรงแรม The Rich"}, {"id": "a9b3dea3-9a23-428e-82f2-6b11c0cfcec3", "type": "text", "order": 42, "value": "เพราะเราเชื่อว่า \\"ที่พักที่ดี\\" ไม่ได้มีเพียงแค่ห้องพัก แต่ยังรวมถึงคุณภาพการใช้ชีวิต ความสะอาด ความปลอดภัย และการบริการที่ใส่ใจในทุกรายละเอียด เราพร้อมดูแลให้ผู้พักอาศัยได้รับความสะดวกสบายตั้งแต่วันแรกที่เข้าอยู่"}, {"id": "84c9b748-ffc7-4112-b50a-c71f16a0a1d6", "type": "text", "order": 43, "value": "หากคุณกำลังมองหาห้องพักรายเดือนที่ครบครัน คุ้มค่า และพร้อมเข้าอยู่ **โรงแรม The Rich** ยินดีต้อนรับเสมอ"}, {"id": "75651ea1-8dd8-4505-a8ed-fbf6a96392e9", "type": "text", "order": 44, "value": "**ติดต่อสอบถามรายละเอียดเพิ่มเติม หรือนัดชมห้องพักได้ทุกวัน เรายินดีให้บริการและพร้อมช่วยคุณค้นหาห้องพักที่เหมาะกับการใช้ชีวิตของคุณมากที่สุด**"}]}	99/88	therich009	PERSONAL	\N	16.188069	103.279726	https://maps.app.goo.gl/pd62mPWGFqjWpPXZ8	ACTIVE	t	t	0	\N	2026-08-01 06:22:51.374	2026-08-02 16:19:18.293
19f1999b-da0e-454d-ad0c-87cdcd8c042e	439e1b14-dde8-40f7-a78d-5f2b2711feeb	บ้านบานาน่า	บ้านบานาน่า	{"sections": [{"id": "6b208d19-6b33-4bca-bacb-dbd1f1f744b1", "type": "text", "order": 1, "value": "หอพักใกล้ มอราช"}, {"id": "7a454d7b-3797-4f55-8b42-3c497f91e78b", "type": "text", "order": 2, "value": "-เพราะนักศึกษา"}, {"id": "12816105-6aeb-4e69-860b-f7ee74057c46", "type": "text", "order": 3, "value": "-เครื่องอำนวยความสะดวก ครบ(ไม่มีตู้เยน)"}]}	106 ซอย31 ถนน ริมคลอง	ิ@babanaball	OFFICIAL	\N	16.192624	103.280535	https://maps.app.goo.gl/w7q3XLP923XYtcd79	ACTIVE	t	t	1	\N	2026-08-02 14:51:35.81	2026-08-02 16:33:12.906
\.


--
-- Data for Name: DormitoryContact; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."DormitoryContact" (id, "dormitoryId", name, phone, "order", "createdAt") FROM stdin;
281e0474-95d3-486e-b31a-6f0957e1b74b	914825e2-daa7-4b83-9ccd-b9a5ea52078b	ปุ้ย	0999999999	0	2026-08-01 08:11:00.541
724acfac-6676-4483-9cd1-30301a81dcc5	693057e6-2d93-406d-862f-749905999fa7	คุณเบล	0807974675	0	2026-08-02 15:50:25.151
67cc618b-5146-41fb-a9b7-145f3814580b	19f1999b-da0e-454d-ad0c-87cdcd8c042e	หมวดบอล	0807933906	0	2026-08-02 16:33:12.91
\.


--
-- Data for Name: DormitorySetting; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."DormitorySetting" (id, "dormitoryId", "roomPrice", "waterBillingType", "waterRate", "electricRate", "commonFee", "lateFee", "dueDay", "dueMonthOffset") FROM stdin;
3432c5d6-80e0-421b-8e29-c09380c1a56c	914825e2-daa7-4b83-9ccd-b9a5ea52078b	3500	METERED	25	9	0	50	5	1
a8baeb9f-70b3-4208-8c0f-d7fe25dbed33	693057e6-2d93-406d-862f-749905999fa7	3000	FLAT_RATE	100	10	0	50	1	1
72abb2d6-b5f9-4d96-8867-b7e3c3cc2543	19f1999b-da0e-454d-ad0c-87cdcd8c042e	2800	FLAT_RATE	200	10	0	50	5	1
\.


--
-- Data for Name: Feature; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Feature" (id, key, name, description, enabled, "createdAt", "updatedAt") FROM stdin;
cms9t16bc0000o58l3jfnypm4	OCR_BILL	OCR สแกนน้ำไฟ	\N	t	2026-08-01 03:21:14.809	2026-08-01 03:21:14.809
\.


--
-- Data for Name: File; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."File" (id, "tenantId", "ownerId", bucket, "dormitoryId", "roomId", "paymentId", "maintenanceId", category, "objectKey", "mimeType", size, "order", "isCover", "createdAt", "announcementId") FROM stdin;
4916c9d6-fca2-4ab6-9038-85fb77515d18	\N	\N	dormplus	914825e2-daa7-4b83-9ccd-b9a5ea52078b	\N	\N	\N	DORMITORY	dorms/914825e2-daa7-4b83-9ccd-b9a5ea52078b/81761105-9224-4a7f-8f81-0ad602679131.webp	image/webp	80812	0	t	2026-08-01 08:10:31.714	\N
df2790cb-c26b-4253-8502-eb37e1d3f3a3	\N	\N	dormplus	914825e2-daa7-4b83-9ccd-b9a5ea52078b	\N	\N	\N	DORMITORY	dorms/914825e2-daa7-4b83-9ccd-b9a5ea52078b/947932dc-b666-4dfd-8852-1a77f14edb03.webp	image/webp	150908	1	f	2026-08-01 08:10:54.275	\N
cc623c1d-5e56-42e1-ab80-a397b88447a1	\N	\N	dormplus	914825e2-daa7-4b83-9ccd-b9a5ea52078b	\N	\N	\N	DORMITORY	dorms/914825e2-daa7-4b83-9ccd-b9a5ea52078b/997b4f4e-93c8-48e6-805f-f9e780d62a87.webp	image/webp	64984	1	f	2026-08-01 08:10:54.565	\N
52ce5e71-3a76-407c-9677-ab63fb7aaf04	\N	\N	dormplus	914825e2-daa7-4b83-9ccd-b9a5ea52078b	\N	\N	\N	DORMITORY	dorms/914825e2-daa7-4b83-9ccd-b9a5ea52078b/463c7df7-ca15-41f5-a8b4-81ede584691c.webp	image/webp	42284	1	f	2026-08-01 08:10:55.236	\N
6153ebd2-2e20-404c-b414-1a7c9c9d2fff	\N	\N	dormplus	914825e2-daa7-4b83-9ccd-b9a5ea52078b	\N	\N	\N	DORMITORY	dorms/914825e2-daa7-4b83-9ccd-b9a5ea52078b/816e0eda-3b37-4589-9af5-5b06489395b1.webp	image/webp	56608	1	f	2026-08-01 08:10:55.27	\N
ed73a7c2-6e2b-4e61-b6ca-5c99dc48a7bb	\N	\N	dormplus	19f1999b-da0e-454d-ad0c-87cdcd8c042e	\N	\N	\N	DORMITORY	dorms/19f1999b-da0e-454d-ad0c-87cdcd8c042e/bc614719-e86f-4053-b889-1eabf0c3b1bd.webp	image/webp	114568	0	t	2026-08-02 15:12:00.725	\N
e501c826-c893-44cd-9eb8-f0ba8bc8d2a9	\N	\N	dormplus	693057e6-2d93-406d-862f-749905999fa7	\N	\N	\N	DORMITORY	dorms/693057e6-2d93-406d-862f-749905999fa7/410108fc-3125-4390-aa83-d9ae450b6713.webp	image/webp	115386	0	t	2026-08-02 15:34:55.203	\N
3888755d-bc0a-41e4-81e7-28548a37614b	\N	\N	dormplus	\N	\N	\N	\N	ANNOUNCEMENT	announcements/19f1999b-da0e-454d-ad0c-87cdcd8c042e/b2e7159b-e256-4f04-a522-c8e98f9f2d70.webp	image/webp	26970	\N	f	2026-08-02 16:39:54.372	6eaaf264-a2a6-4362-8daf-26d1f653eef7
718647a2-7453-4a1a-8dcc-23b3eedc5372	\N	\N	dormplus	\N	\N	\N	a653a2b7-d811-4c70-9589-9445d67e7221	MAINTENANCE	maintenance/19f1999b-da0e-454d-ad0c-87cdcd8c042e/80082ec2-0034-4171-992c-627e0ff70cfe.jpeg	image/jpeg	22706	\N	f	2026-08-04 06:23:12.489	\N
\.


--
-- Data for Name: Landmark; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Landmark" (id, name, slug, type, latitude, longitude, "mapUrl", status, "createdAt", "updatedAt") FROM stdin;
a394d7bf-5a2c-4d0c-a5b4-58c2aeefef7b	มหาวิทยาลัยมหาสารคาม	mahasarakham-university	UNIVERSITY	16.24403	103.24903	https://maps.google.com/?q=16.24403,103.24903	ACTIVE	2026-08-01 03:21:14.814	2026-08-01 03:21:14.814
ce13b46d-1366-4017-99d5-c4847a56949d	มอเก่าสารคาม	msu-old-campus	UNIVERSITY	16.2002	103.28207	https://maps.google.com/?q=16.20020,103.28207	ACTIVE	2026-08-01 03:21:14.817	2026-08-01 03:21:14.817
61103fa1-b353-4285-ac0a-b306e4f7d4e7	เสริมไทยคอมเพล็กซ์	sermthai-complex	SHOPPING_MALL	16.20179	103.27648	https://maps.google.com/?q=16.20179,103.27648	ACTIVE	2026-08-01 03:21:14.82	2026-08-01 03:21:14.82
d2196197-512c-47be-bbb1-3ab45ad359cf	มหาวิทยาลัยราชภัฏมหาสารคาม	rmu	UNIVERSITY	16.20076	103.27101	https://maps.google.com/?q=16.20076,103.27101	ACTIVE	2026-08-01 03:21:14.822	2026-08-01 03:21:14.822
\.


--
-- Data for Name: MaintenanceMessage; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."MaintenanceMessage" (id, "maintenanceId", "senderRole", "senderId", message, "createdAt", "editedAt") FROM stdin;
f4a15160-4269-4fc1-90f5-d9e5a4831cf5	a653a2b7-d811-4c70-9589-9445d67e7221	TENANT	08cf9084-4643-45f5-bf64-bdb10986f250	มาซ่อมด่วน!!!	2026-08-04 06:27:09.094	\N
\.


--
-- Data for Name: MaintenanceRequest; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."MaintenanceRequest" (id, "dormitoryId", "roomId", "tenantId", title, description, status, "createdAt", "updatedAt", "ownerNote") FROM stdin;
a653a2b7-d811-4c70-9589-9445d67e7221	19f1999b-da0e-454d-ad0c-87cdcd8c042e	90728cf4-3957-4061-b9a5-f5b25d1c1e96	eeb709d0-e3d3-4fd3-9fc3-144e639deaf0	ส้วมแตก	ส้วมแตกกกก	COMPLETED	2026-08-04 06:23:12.489	2026-08-04 06:28:58.411	\N
\.


--
-- Data for Name: OwnerProfile; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."OwnerProfile" (id, "userId", status, "fullName", "lineId", phone, facebook, "deletedAt", "createdAt") FROM stdin;
05450fcb-422f-4e62-be1d-dd85d987b425	242aa843-8771-41d1-a19c-459a85ba596c	APPROVED	นาย เดอะ ริช	\N	0987654321	\N	\N	2026-08-01 06:22:51.372
439e1b14-dde8-40f7-a78d-5f2b2711feeb	f3dd28be-80b0-424d-8580-84af36b6ef14	APPROVED	WEERACHAI ARDEE	\N	0807974675	\N	\N	2026-08-02 14:51:35.808
\.


--
-- Data for Name: PasswordResetOtp; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."PasswordResetOtp" (id, "userId", "otpHash", attempts, "expiresAt", "consumedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Payment" (id, "billId", status, "verifiedBy", "verifiedAt", "paymentMethod", "transferRef", "transferAmount", "transferBank", "senderName", "paidAt", "updatedAt", "createdAt") FROM stdin;
d9be9655-faea-459f-8d27-efe60db4c228	379f9420-b1b7-4052-a066-550a0c881f83	VERIFIED	WEERACHAI ARDEE	2026-08-02 16:38:07.53	CASH	\N	\N	\N	\N	\N	2026-08-02 16:38:07.531	2026-08-02 16:38:07.531
924acc5b-15d5-48f4-89b0-39be7b1c99cb	e2e1d448-e126-46b4-8f11-01605fab8854	VERIFIED	WEERACHAI ARDEE	2026-08-04 06:34:34.088	CASH	\N	\N	\N	\N	\N	2026-08-04 06:34:34.089	2026-08-04 06:34:34.089
\.


--
-- Data for Name: PaymentSetting; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."PaymentSetting" (id, "dormitoryId", "promptPayType", "promptPayValue", "bankName", "bankAccount", "bankHolder", "promptPayHolder", "isActive") FROM stdin;
741ef67c-08d1-487c-b6f6-069ba21027dd	914825e2-daa7-4b83-9ccd-b9a5ea52078b	PHONE	0957295167	kbank	1173258352	นาย ปยุต โตบุญมา	นาย ปยุต โตบุญมา	t
89f6d361-3cf6-43c5-801a-06f525a6b900	693057e6-2d93-406d-862f-749905999fa7	\N		scb	4589359775	mabel		t
05d7e40d-01d8-4ceb-a605-77a24f28c054	19f1999b-da0e-454d-ad0c-87cdcd8c042e	\N		ktb	4373134995	นาย วีระชัย อาดี		t
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."Room" (id, "dormitoryId", "roomNumber", floor, type, description, "basePrice", status, "deletedAt", "createdAt") FROM stdin;
789dbd89-0e54-4c2d-b16b-d4aec5d8b1cd	693057e6-2d93-406d-862f-749905999fa7	102	1	AIR		3000	AVAILABLE	\N	2026-08-02 15:40:00.479
4390b8e6-f226-4b35-9594-10820e3a5c34	693057e6-2d93-406d-862f-749905999fa7	103	1	AIR		3000	AVAILABLE	\N	2026-08-02 15:40:00.479
f11d3179-59ee-4c3d-be7a-6f86ddd33eb3	693057e6-2d93-406d-862f-749905999fa7	201	2	FAN		2000	AVAILABLE	\N	2026-08-02 15:40:00.479
03793e3e-0f2f-43a8-b402-9c9713cc2532	693057e6-2d93-406d-862f-749905999fa7	202	2	FAN		2000	AVAILABLE	\N	2026-08-02 15:40:00.479
cad59c93-aa45-48ba-a9bf-a0e479e21af9	693057e6-2d93-406d-862f-749905999fa7	203	2	FAN		2000	AVAILABLE	\N	2026-08-02 15:40:00.479
5cf82ffc-aa75-426f-8220-c221774e0c31	19f1999b-da0e-454d-ad0c-87cdcd8c042e	A3	1	AIR		2800	AVAILABLE	\N	2026-08-02 15:38:21.384
8ac3a3ef-4158-4fd6-a9a9-280787b524c2	19f1999b-da0e-454d-ad0c-87cdcd8c042e	A4	1	AIR		2800	AVAILABLE	\N	2026-08-02 15:38:21.384
90728cf4-3957-4061-b9a5-f5b25d1c1e96	19f1999b-da0e-454d-ad0c-87cdcd8c042e	A1	1	AIR		2800	OCCUPIED	\N	2026-08-02 15:38:21.384
9c9eec57-1705-47aa-b106-5f148a673107	19f1999b-da0e-454d-ad0c-87cdcd8c042e	A2	1	AIR		2800	OCCUPIED	\N	2026-08-02 15:38:21.384
dccb680a-5091-4435-95e8-cb9967747de6	19f1999b-da0e-454d-ad0c-87cdcd8c042e	A5	1	AIR		2800	MAINTENANCE	\N	2026-08-02 15:38:21.384
36270146-fca1-4572-ad24-c8a4470e5195	693057e6-2d93-406d-862f-749905999fa7	101	1	AIR		3000	OCCUPIED	\N	2026-08-02 15:40:00.479
ce743448-c0d0-4cd5-b9ce-076137d59a55	914825e2-daa7-4b83-9ccd-b9a5ea52078b	A101	1	AIR		3500	OCCUPIED	\N	2026-08-01 08:11:23.87
\.


--
-- Data for Name: RoomMeterSetting; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."RoomMeterSetting" (id, "roomId", "electricMeterDigits", "waterMeterDigits", "createdAt", "updatedAt") FROM stdin;
5d425032-e553-4f10-b330-7e1d0f412908	ce743448-c0d0-4cd5-b9ce-076137d59a55	5	\N	2026-08-01 08:11:23.872	2026-08-01 08:11:23.872
2f26b9c1-6be0-42a2-a2b4-0e1882e4590b	36270146-fca1-4572-ad24-c8a4470e5195	5	\N	2026-08-02 15:40:00.482	2026-08-02 15:40:00.482
c6af080f-b520-4cf6-a320-2469aeb67703	789dbd89-0e54-4c2d-b16b-d4aec5d8b1cd	5	\N	2026-08-02 15:40:00.482	2026-08-02 15:40:00.482
43ce9692-01fc-40ef-a08b-4712ec37cd85	4390b8e6-f226-4b35-9594-10820e3a5c34	5	\N	2026-08-02 15:40:00.482	2026-08-02 15:40:00.482
71e78a53-e1cf-4724-b75e-ffed391760d3	f11d3179-59ee-4c3d-be7a-6f86ddd33eb3	5	\N	2026-08-02 15:40:00.482	2026-08-02 15:40:00.482
4851fe16-6915-4e55-90ba-acee26b988bb	03793e3e-0f2f-43a8-b402-9c9713cc2532	5	\N	2026-08-02 15:40:00.482	2026-08-02 15:40:00.482
46ff2c44-1663-4ae5-a6b4-5aee48d227b4	cad59c93-aa45-48ba-a9bf-a0e479e21af9	5	\N	2026-08-02 15:40:00.482	2026-08-02 15:40:00.482
1a4e848d-fdd0-427b-ab52-7ad66f7dec04	90728cf4-3957-4061-b9a5-f5b25d1c1e96	5	\N	2026-08-02 15:38:21.386	2026-08-02 15:42:35.584
4897b504-08f0-424b-937b-6ba45dd2263c	9c9eec57-1705-47aa-b106-5f148a673107	5	\N	2026-08-02 15:38:21.386	2026-08-02 15:42:51.836
ac68961e-294c-4c26-8ca6-96e7126cb04c	5cf82ffc-aa75-426f-8220-c221774e0c31	5	\N	2026-08-02 15:38:21.386	2026-08-02 15:42:56.912
17219f07-4a2b-42f1-96c7-f0f5e6aa3cf0	8ac3a3ef-4158-4fd6-a9a9-280787b524c2	5	\N	2026-08-02 15:38:21.386	2026-08-02 15:43:00.859
334b1c9c-839e-4d0d-8c01-d2f5282d91cd	dccb680a-5091-4435-95e8-cb9967747de6	5	\N	2026-08-02 15:38:21.386	2026-08-02 16:26:44.116
\.


--
-- Data for Name: RoomQrAuth; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."RoomQrAuth" (id, "roomId", token, "isActive", "createdAt", "updatedAt") FROM stdin;
94989e5a-5828-4ee9-b8ef-e5cb32a69e14	90728cf4-3957-4061-b9a5-f5b25d1c1e96	$argon2id$v=19$m=65536,t=3,p=1$/tTOC8Ftl5dfZ7v8MYRjQg$fBeMaTWIbQ1V7ueARAVNEGX+6KPMvMXDXm3dlnQBYzc	t	2026-08-02 15:59:57.842	2026-08-04 06:19:36.815
7ab34f49-e84d-4145-90d9-173360661a0d	ce743448-c0d0-4cd5-b9ce-076137d59a55	$argon2id$v=19$m=65536,t=3,p=1$sMu8xuYQT8AM+OGj2KHwTQ$3zj9SPW4ZjEHpPEKMqV1GFcYF4VKaY3vNOmVzfO7mpA	f	2026-08-11 06:18:47.522	2026-08-11 06:22:47.952
\.


--
-- Data for Name: TenantProfile; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."TenantProfile" (id, "userId", "roomId", "firstName", "lastName", phone, email, "idCard", address, "numberOfResidents", "tenantNameSnapshot", "securityDeposit", "advancePayment", "entranceFee", "contractStartDate", "contractEndDate", "moveInDate", "moveOutDate", "isActive", "deletedAt", notes, "emergencyContactName", "emergencyContactPhone", "createdAt") FROM stdin;
eeb709d0-e3d3-4fd3-9fc3-144e639deaf0	08cf9084-4643-45f5-bf64-bdb10986f250	90728cf4-3957-4061-b9a5-f5b25d1c1e96	เอกภพ	หล่อเลย	61d7b12b89413a28808b88c1dc04d802:69935ad073bd517fc98a679fb820e839:b5027644749b1bd87293	673321070112@rmu.ac.th	1b31de68417ba5d44f1ac30d5a225492:2da8e8e6bf4da77e8d654ba7e7d30e10:75eacd63e2bfe30da18174eb9f	a7f7aea435a26c58096611d1036f8196:4f6c8b579d43ec1a94b3a4cd1ba380fd:10db806e99c9fe0bea0b34371eacc06913df34e0440666256709805647f60dbf8e51860939369a43feec6420e896ea4e55ed8afcd28fe8aa4823	1	เอกภพ หล่อเลย	2000	2800	0	2026-08-02 00:00:00	2027-08-02 00:00:00	2026-08-02 00:00:00	\N	t	\N		3eeb59d2bac11ce1e0edf2aa331ac5f7:cbfc15e68059792739e76d3a18e236bf:f4b196	a82d2afce8667614d7a35915625d6d3b:1d04c9289ab0edf16447e44aaa7276dd:4151ef5c6216f6ed89	2026-08-02 15:59:19.653
d3052028-4cfa-42e9-ae7d-d2cc09432d74	fa68c8b8-2fb1-436c-bf26-2a27dfc89605	9c9eec57-1705-47aa-b106-5f148a673107	สักชัย	อร่อยดี	693896f031bddaaf9b1652834ec75923:4d305006849a4ebcf2aab2b8a5ce76ea:ea1b9a00d53b4814321e	weerachai@gmail.com	8b17c6e267935b336863b21f460e9588:099db041e70c1ce5e9f77f1ec18cda50:867603438553fbd51b3aa4a92c	7568c45427d5e3153f541a7a877e29b7:ee5005b1dcd5032029d4db3b1c2cd94a:157de6df53620ed513e6100dda77275a34d5c6d931f85b1248b1c4cdcca1105c2e9a4ce2bd45fb3532c69444b625eb112be941b3edb492de46f0bf134f168c	1	สักชัย อร่อยดี	2000	2800	0	2026-08-02 00:00:00	2027-08-02 00:00:00	2026-08-02 00:00:00	\N	t	\N		\N	\N	2026-08-02 16:02:06.661
2bc9c91a-6efe-4fb1-bacd-d256aa55a77f	15760906-f6d0-4c34-b80b-6d6a8cf1dd0f	36270146-fca1-4572-ad24-c8a4470e5195	จัสติน	อลาบา	6c73a7e62bbe77d1258979abc3420a66:e35eea39f090d87b9e9fa8021d94b622:a2b3d26839d4e30759e2	weerachai08@gmail.com	73ad48f9b3aded48c488b5dc7788071c:09b78f525c8d64483119bd47642d6e37:9d4131f797f6c58dcb765a42cc	292e3bb05ce6f665cf7fbd903946cf8e:db583c802789ddd4967bb8eb9af321eb:f84ceb8e961774d4ff59947ddfcb55825b1a40a17e7039b158d397cb4d99b6	1	จัสติน อลาบา	2000	3000	0	2026-08-02 00:00:00	2027-08-02 00:00:00	2026-08-02 00:00:00	\N	t	\N		c38415717d226218ea8e437b0c6d6f92:dfe6528bb31fd5864ccf022813fc51dd:22176f87f736	8541af5c94ad9798895eca5901b55c96:2c91c1b0cac4e86ae76b0cef54d191da:721f9eb99ee664cf2a51	2026-08-02 16:37:39.041
8674eef8-d3c7-4fbe-8dc1-b155f1bac7de	6eb1257f-781f-4e70-a50a-86ee7a6266c9	ce743448-c0d0-4cd5-b9ce-076137d59a55	ทดสอบ	เทสๆ	66c4b28950eb7af35448bd3c1e8aeca0:8713acedbbc10ab88e5d3fc34a778b73:a6d2e9290be5baa47b2f	673321070106@rmu.ac.th	9ef8c3eda810d87da3293c4d24c52e9c:9baf21d1c956192b7385109641d197d5:2fe92483241771ecfec17c2d3e	1f3a5b3a46cb4581b78c11937d48bf1d:9de2ab8e9a01ec296e7bc444bacf4eb3:0aab1eda	1	ทดสอบ เทสๆ	5000	3500	0	2026-08-11 00:00:00	2027-08-11 00:00:00	2026-08-11 00:00:00	\N	t	\N		\N	\N	2026-08-11 06:18:37.941
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: rentflow
--

COPY public."User" (id, email, password, role, "deletedAt", status, "failedLoginAttempts", "lockedUntil", "createdAt", "updatedAt") FROM stdin;
f8e3dd10-f5df-4607-93ca-23e1534f61c2	payuttobunma.pt@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$5sxXlS2ML4dEUa6pMBy3VA$OvBJJVrlqfhc7DpmznjrAwVkRu7oJrRmmSl5yqZjh8A	ADMIN	\N	ACTIVE	0	\N	2026-08-01 03:21:14.8	2026-08-02 14:53:27.694
fa68c8b8-2fb1-436c-bf26-2a27dfc89605	weerachai@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$OliSloMFtEizKD5rEzzNTg$cqYrdBxlNcEfmomkd2bS3CElwuLMTXa14+ITFg07+jY	TENANT	\N	ACTIVE	0	\N	2026-08-02 16:02:06.657	2026-08-02 16:02:06.657
15760906-f6d0-4c34-b80b-6d6a8cf1dd0f	weerachai08@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$CMgsKe+wHWZtBJN+PYlmWA$NHiIjG3tn/EqUcYa0F1eEcrdbiAEAMa8GpWSI2f6tg4	TENANT	\N	ACTIVE	0	\N	2026-08-02 16:37:39.039	2026-08-02 16:37:39.039
242aa843-8771-41d1-a19c-459a85ba596c	azxsw0256@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$7VkeOWr4CuqyIhF5qbRXrg$b2wU4sebr/GXP9wVMzFOQV830xfloqqqLZWn1zFEn+U	OWNER	\N	ACTIVE	0	\N	2026-08-01 06:22:51.368	2026-08-11 06:17:47.163
6eb1257f-781f-4e70-a50a-86ee7a6266c9	673321070106@rmu.ac.th	$argon2id$v=19$m=65536,t=3,p=4$cnKen4DT8s04vjT9PJ5zKQ$UGhdxTHXrre8t4QMN7JnJviacZmpRqcUDMa56TzzcLI	TENANT	\N	ACTIVE	0	\N	2026-08-11 06:18:37.939	2026-08-11 06:18:37.939
08cf9084-4643-45f5-bf64-bdb10986f250	673321070112@rmu.ac.th	$argon2id$v=19$m=65536,t=3,p=4$JfRZ853hMh6oZdXKEBS0yw$cIk9HIBCL6FotCMENamFNhzmTiF1e6iVy3oujBoZalA	TENANT	\N	ACTIVE	4	\N	2026-08-02 15:59:19.651	2026-08-12 19:17:06.566
f3dd28be-80b0-424d-8580-84af36b6ef14	weerachai0888@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$1jT4+7XN1ao4yK0WP7j81A$waAzkuAgDVP4JVoEPUj5ovu2hXduX7cb+gwSnJkoxZc	OWNER	\N	ACTIVE	0	\N	2026-08-02 14:51:35.805	2026-08-18 07:03:33.904
\.


--
-- Name: AnnouncementReadLog AnnouncementReadLog_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."AnnouncementReadLog"
    ADD CONSTRAINT "AnnouncementReadLog_pkey" PRIMARY KEY (id);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: BillDraft BillDraft_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."BillDraft"
    ADD CONSTRAINT "BillDraft_pkey" PRIMARY KEY (id);


--
-- Name: BillItem BillItem_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_pkey" PRIMARY KEY (id);


--
-- Name: Bill Bill_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_pkey" PRIMARY KEY (id);


--
-- Name: DormitoryContact DormitoryContact_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."DormitoryContact"
    ADD CONSTRAINT "DormitoryContact_pkey" PRIMARY KEY (id);


--
-- Name: DormitorySetting DormitorySetting_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."DormitorySetting"
    ADD CONSTRAINT "DormitorySetting_pkey" PRIMARY KEY (id);


--
-- Name: Dormitory Dormitory_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Dormitory"
    ADD CONSTRAINT "Dormitory_pkey" PRIMARY KEY (id);


--
-- Name: Feature Feature_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Feature"
    ADD CONSTRAINT "Feature_pkey" PRIMARY KEY (id);


--
-- Name: File File_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_pkey" PRIMARY KEY (id);


--
-- Name: Landmark Landmark_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Landmark"
    ADD CONSTRAINT "Landmark_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceMessage MaintenanceMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."MaintenanceMessage"
    ADD CONSTRAINT "MaintenanceMessage_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceRequest MaintenanceRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY (id);


--
-- Name: OwnerProfile OwnerProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."OwnerProfile"
    ADD CONSTRAINT "OwnerProfile_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetOtp PasswordResetOtp_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."PasswordResetOtp"
    ADD CONSTRAINT "PasswordResetOtp_pkey" PRIMARY KEY (id);


--
-- Name: PaymentSetting PaymentSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."PaymentSetting"
    ADD CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: RoomMeterSetting RoomMeterSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."RoomMeterSetting"
    ADD CONSTRAINT "RoomMeterSetting_pkey" PRIMARY KEY (id);


--
-- Name: RoomQrAuth RoomQrAuth_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."RoomQrAuth"
    ADD CONSTRAINT "RoomQrAuth_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: TenantProfile TenantProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."TenantProfile"
    ADD CONSTRAINT "TenantProfile_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: AnnouncementReadLog_announcementId_tenantId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "AnnouncementReadLog_announcementId_tenantId_key" ON public."AnnouncementReadLog" USING btree ("announcementId", "tenantId");


--
-- Name: Announcement_dormitoryId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Announcement_dormitoryId_idx" ON public."Announcement" USING btree ("dormitoryId");


--
-- Name: Announcement_isPinned_order_createdAt_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Announcement_isPinned_order_createdAt_idx" ON public."Announcement" USING btree ("isPinned", "order", "createdAt");


--
-- Name: BillDraft_dormitoryId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "BillDraft_dormitoryId_idx" ON public."BillDraft" USING btree ("dormitoryId");


--
-- Name: Bill_roomId_billingMonth_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Bill_roomId_billingMonth_key" ON public."Bill" USING btree ("roomId", "billingMonth");


--
-- Name: Bill_status_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Bill_status_idx" ON public."Bill" USING btree (status);


--
-- Name: Bill_tenantId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Bill_tenantId_idx" ON public."Bill" USING btree ("tenantId");


--
-- Name: DormitoryContact_dormitoryId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "DormitoryContact_dormitoryId_idx" ON public."DormitoryContact" USING btree ("dormitoryId");


--
-- Name: DormitorySetting_dormitoryId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "DormitorySetting_dormitoryId_key" ON public."DormitorySetting" USING btree ("dormitoryId");


--
-- Name: Dormitory_isFeatured_featuredOrder_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Dormitory_isFeatured_featuredOrder_idx" ON public."Dormitory" USING btree ("isFeatured", "featuredOrder");


--
-- Name: Dormitory_ownerId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Dormitory_ownerId_idx" ON public."Dormitory" USING btree ("ownerId");


--
-- Name: Dormitory_slug_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Dormitory_slug_key" ON public."Dormitory" USING btree (slug);


--
-- Name: Feature_key_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Feature_key_key" ON public."Feature" USING btree (key);


--
-- Name: File_announcementId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "File_announcementId_idx" ON public."File" USING btree ("announcementId");


--
-- Name: File_dormitoryId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "File_dormitoryId_idx" ON public."File" USING btree ("dormitoryId");


--
-- Name: File_maintenanceId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "File_maintenanceId_idx" ON public."File" USING btree ("maintenanceId");


--
-- Name: File_paymentId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "File_paymentId_idx" ON public."File" USING btree ("paymentId");


--
-- Name: File_roomId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "File_roomId_idx" ON public."File" USING btree ("roomId");


--
-- Name: Landmark_slug_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Landmark_slug_key" ON public."Landmark" USING btree (slug);


--
-- Name: MaintenanceMessage_maintenanceId_createdAt_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "MaintenanceMessage_maintenanceId_createdAt_idx" ON public."MaintenanceMessage" USING btree ("maintenanceId", "createdAt");


--
-- Name: MaintenanceRequest_dormitoryId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "MaintenanceRequest_dormitoryId_idx" ON public."MaintenanceRequest" USING btree ("dormitoryId");


--
-- Name: MaintenanceRequest_roomId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "MaintenanceRequest_roomId_idx" ON public."MaintenanceRequest" USING btree ("roomId");


--
-- Name: MaintenanceRequest_tenantId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "MaintenanceRequest_tenantId_idx" ON public."MaintenanceRequest" USING btree ("tenantId");


--
-- Name: OwnerProfile_userId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "OwnerProfile_userId_key" ON public."OwnerProfile" USING btree ("userId");


--
-- Name: PasswordResetOtp_userId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "PasswordResetOtp_userId_idx" ON public."PasswordResetOtp" USING btree ("userId");


--
-- Name: PaymentSetting_dormitoryId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "PaymentSetting_dormitoryId_key" ON public."PaymentSetting" USING btree ("dormitoryId");


--
-- Name: Payment_billId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Payment_billId_key" ON public."Payment" USING btree ("billId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: Payment_transferRef_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Payment_transferRef_key" ON public."Payment" USING btree ("transferRef");


--
-- Name: RoomMeterSetting_roomId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "RoomMeterSetting_roomId_key" ON public."RoomMeterSetting" USING btree ("roomId");


--
-- Name: RoomQrAuth_roomId_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "RoomQrAuth_roomId_key" ON public."RoomQrAuth" USING btree ("roomId");


--
-- Name: RoomQrAuth_token_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "RoomQrAuth_token_key" ON public."RoomQrAuth" USING btree (token);


--
-- Name: Room_dormitoryId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "Room_dormitoryId_idx" ON public."Room" USING btree ("dormitoryId");


--
-- Name: Room_dormitoryId_roomNumber_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "Room_dormitoryId_roomNumber_key" ON public."Room" USING btree ("dormitoryId", "roomNumber");


--
-- Name: TenantProfile_roomId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "TenantProfile_roomId_idx" ON public."TenantProfile" USING btree ("roomId");


--
-- Name: TenantProfile_userId_idx; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE INDEX "TenantProfile_userId_idx" ON public."TenantProfile" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: rentflow
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: AnnouncementReadLog AnnouncementReadLog_announcementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."AnnouncementReadLog"
    ADD CONSTRAINT "AnnouncementReadLog_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES public."Announcement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnnouncementReadLog AnnouncementReadLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."AnnouncementReadLog"
    ADD CONSTRAINT "AnnouncementReadLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."TenantProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Announcement Announcement_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BillDraft BillDraft_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."BillDraft"
    ADD CONSTRAINT "BillDraft_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BillItem BillItem_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."Bill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bill Bill_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bill Bill_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."TenantProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DormitoryContact DormitoryContact_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."DormitoryContact"
    ADD CONSTRAINT "DormitoryContact_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DormitorySetting DormitorySetting_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."DormitorySetting"
    ADD CONSTRAINT "DormitorySetting_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dormitory Dormitory_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Dormitory"
    ADD CONSTRAINT "Dormitory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."OwnerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: File File_announcementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES public."Announcement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: File File_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: File File_maintenanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: File File_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: File File_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaintenanceMessage MaintenanceMessage_maintenanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."MaintenanceMessage"
    ADD CONSTRAINT "MaintenanceMessage_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MaintenanceRequest MaintenanceRequest_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceRequest MaintenanceRequest_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceRequest MaintenanceRequest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."TenantProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OwnerProfile OwnerProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."OwnerProfile"
    ADD CONSTRAINT "OwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetOtp PasswordResetOtp_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."PasswordResetOtp"
    ADD CONSTRAINT "PasswordResetOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentSetting PaymentSetting_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."PaymentSetting"
    ADD CONSTRAINT "PaymentSetting_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."Bill"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RoomMeterSetting RoomMeterSetting_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."RoomMeterSetting"
    ADD CONSTRAINT "RoomMeterSetting_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoomQrAuth RoomQrAuth_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."RoomQrAuth"
    ADD CONSTRAINT "RoomQrAuth_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Room Room_dormitoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES public."Dormitory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TenantProfile TenantProfile_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."TenantProfile"
    ADD CONSTRAINT "TenantProfile_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenantProfile TenantProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rentflow
--

ALTER TABLE ONLY public."TenantProfile"
    ADD CONSTRAINT "TenantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict R0qFpEVz03TkHA4EtAK73hK3FRJP1syC8LsoPiv2ud84rmnbFKErRCiBlnOiBdp

--
-- PostgreSQL database cluster dump complete
--

