import mongoose from "mongoose";
import { GET, PUT } from "../src/app/api/admin/config/club-trekking/route";
import ClubTrekkingConfig from "../src/models/ClubTrekkingConfig";
import User from "../src/models/user";
import { NextRequest } from "next/server";

// Mock DB Connection
jest.mock("@/libs/mongodb", () => jest.fn());
jest.mock("@/libs/authOptions", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { email: "admin@test.com" } }),
}));

async function testConfigEndpoints() {
    console.log("🧪 Iniciando prueba de endpoints de configuración...");

    // 1. Test GET (Default)
    console.log("🔹 Probando GET (Default)...");
    ClubTrekkingConfig.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(null), // No config in DB
    });

    const reqGet = {} as NextRequest;
    const resGet = await GET(reqGet);
    const dataGet = await resGet.json();

    if (dataGet.source === "default_env") {
        console.log("✅ GET Default correcto");
    } else {
        console.error("❌ GET Default falló", dataGet);
    }

    // 2. Test PUT
    console.log("🔹 Probando PUT...");
    const mockUserId = new mongoose.Types.ObjectId();

    User.findOne = jest.fn().mockResolvedValue({ _id: mockUserId });

    // Mock create
    ClubTrekkingConfig.create = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn(),
    }));

    const body = {
        precioMensual: 30000,
        maxPrecioSalida: 12000,
    };

    const reqPut = {
        json: async () => body,
    } as NextRequest;

    const resPut = await PUT(reqPut);
    const dataPut = await resPut.json();

    if (dataPut.success && dataPut.config.precioMensual === 30000) {
        console.log("✅ PUT correcto");
    } else {
        console.error("❌ PUT falló", dataPut);
    }
}

// Run test if called directly
if (require.main === module) {
    testConfigEndpoints().catch(console.error);
}
