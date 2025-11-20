import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import ClubTrekkingConfig from "@/models/ClubTrekkingConfig";
import User from "@/models/user";
import { authOptions } from "@/libs/authOptions";
import { CLUB_TREKKING_CONFIG } from "@/config/clubTrekking.config";

/**
 * GET /api/admin/config/club-trekking
 * Obtiene la configuración actual del Club del Trekking
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        // Intentar obtener la configuración de la BD
        let config = await ClubTrekkingConfig.findOne().sort({ createdAt: -1 });

        // Si no existe, devolver los valores por defecto del archivo de config
        if (!config) {
            return NextResponse.json(
                {
                    source: "default_env",
                    config: {
                        precioMensual: CLUB_TREKKING_CONFIG.PRECIO_MENSUAL,
                        maxPrecioSalida: CLUB_TREKKING_CONFIG.MAX_PRECIO_SALIDA,
                        limiteSemanal: CLUB_TREKKING_CONFIG.LIMITES.SALIDAS_POR_SEMANA,
                        radioCheckIn: CLUB_TREKKING_CONFIG.CHECK_IN.RADIO_METROS,
                        deportePermitido: CLUB_TREKKING_CONFIG.DEPORTE_PERMITIDO,
                        active: true,
                    },
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                source: "database",
                config,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al obtener configuración:", error);
        return NextResponse.json(
            { error: "Error al obtener la configuración" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/config/club-trekking
 * Actualiza la configuración del Club del Trekking
 */
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        await connectDB();

        // Verificar permisos de admin
        // TODO: Mejorar validación de roles. Por ahora verificamos si el usuario existe.
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // TODO: Agregar check de rol: if (user.role !== 'admin') ...

        const body = await req.json();
        const {
            precioMensual,
            maxPrecioSalida,
            limiteSemanal,
            radioCheckIn,
            deportePermitido,
            active,
        } = body;

        // Validaciones básicas
        if (precioMensual < 0 || maxPrecioSalida < 0) {
            return NextResponse.json(
                { error: "Los precios no pueden ser negativos" },
                { status: 400 }
            );
        }

        // Buscar config existente o crear una nueva
        let config = await ClubTrekkingConfig.findOne().sort({ createdAt: -1 });

        if (config) {
            // Actualizar existente
            config.precioMensual = precioMensual ?? config.precioMensual;
            config.maxPrecioSalida = maxPrecioSalida ?? config.maxPrecioSalida;
            config.limiteSemanal = limiteSemanal ?? config.limiteSemanal;
            config.radioCheckIn = radioCheckIn ?? config.radioCheckIn;
            config.deportePermitido = deportePermitido ?? config.deportePermitido;
            config.active = active ?? config.active;
            config.updatedBy = user._id;
            await config.save();
        } else {
            // Crear nueva
            config = await ClubTrekkingConfig.create({
                precioMensual: precioMensual ?? CLUB_TREKKING_CONFIG.PRECIO_MENSUAL,
                maxPrecioSalida: maxPrecioSalida ?? CLUB_TREKKING_CONFIG.MAX_PRECIO_SALIDA,
                limiteSemanal: limiteSemanal ?? CLUB_TREKKING_CONFIG.LIMITES.SALIDAS_POR_SEMANA,
                radioCheckIn: radioCheckIn ?? CLUB_TREKKING_CONFIG.CHECK_IN.RADIO_METROS,
                deportePermitido: deportePermitido ?? CLUB_TREKKING_CONFIG.DEPORTE_PERMITIDO,
                active: active ?? true,
                updatedBy: user._id,
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: "Configuración actualizada correctamente",
                config,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al actualizar configuración:", error);
        return NextResponse.json(
            { error: "Error al actualizar la configuración" },
            { status: 500 }
        );
    }
}
