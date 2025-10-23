import { BaseRepository, RepositoryOptions } from "./BaseRepository";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import Sponsors from "@/models/sponsors";
import { Document } from "mongoose";
import { ImageService } from "@/libs/services/ImageService";

export interface ISalidaSocial extends Document {
  _id: string;
  nombre: string;
  ubicacion?: string;
  deporte?: string;
  fecha?: string;
  hora?: string;
  duracion?: string;
  descripcion?: string;
  whatsappLink?: string;
  localidad?: string;
  telefonoOrganizador?: string;
  imagen?: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  dificultad?: string;
  precio?: string;
  creador_id: any;
  stravaActivity?: any;
  stravaMap?: {
    id?: string;
    summary_polyline?: string;
    polyline?: string;
    resource_state?: number;
  };
  cupo: number;
  detalles?: string;
  provincia?: string;
  cbu?: string;
  alias?: string;
  profesorId?: any;
  shortId?: string;
  sponsors?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SalidaSocialFilters {
  deporte?: string;
  localidad?: string;
  provincia?: string;
  dificultad?: string;
  fecha?: string;
  precioMinimo?: number;
  precioMaximo?: number;
  creador_id?: string;
  conCupos?: boolean;
}

export interface PopulatedSalidaSocial
  extends Omit<ISalidaSocial, "creador_id" | "profesorId"> {
  creador_id: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    imagen: string;
  };
  profesorId?: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen: string;
    bio?: string;
    telnumber?: string;
    rol: string;
  };
}

/**
 * Repository for SalidaSocial (Social Events) operations
 * Extends BaseRepository with social event-specific functionality
 */
export class SalidaSocialRepository extends BaseRepository<ISalidaSocial> {
  constructor() {
    super(SalidaSocial, "Salida Social");
  }

  /**
   * Find a social event with all populated data and profile images
   */
  async findWithPopulatedData(
    id: string,
    options: RepositoryOptions = {}
  ): Promise<PopulatedSalidaSocial> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // Ensure models are registered
      // User model and Sponsors model registration check

      // Find with all populations
      const salida = await this.model
        .findById(id)
        .populate("creador_id")
        .populate("profesorId")
        .populate("sponsors")
        .exec();

      if (!salida) {
        throw this.handleError(
          new Error("Not found"),
          `buscar ${this.resourceName} por ID`
        );
      }

      // Convert to plain object
      const salidaObj = salida.toObject() as any;

      // Get creator profile image with fallback
      let creatorImageUrl: string;
      try {
        creatorImageUrl = await ImageService.getProfileImageWithFallback(
          salida.creador_id._id.toString(),
          salida.creador_id.firstname
        );
      } catch (error) {
        // Image fetch failed for creator
        creatorImageUrl = ImageService.generateAvatarUrl(
          salida.creador_id.firstname
        );
      }

      // Update creator info with image
      salidaObj.creador_id = {
        _id: salida.creador_id._id,
        firstname: salida.creador_id.firstname,
        lastname: salida.creador_id.lastname,
        email: salida.creador_id.email,
        imagen: creatorImageUrl,
      };

      // Update professor info if exists
      if (salida.profesorId) {
        let professorImageUrl: string;
        try {
          professorImageUrl = await ImageService.getProfileImageWithFallback(
            salida.profesorId._id.toString(),
            salida.profesorId.firstname
          );
        } catch (error) {
          // Image fetch failed for professor
          professorImageUrl = ImageService.generateAvatarUrl(
            salida.profesorId.firstname
          );
        }

        salidaObj.profesorId = {
          _id: salida.profesorId._id,
          firstname: salida.profesorId.firstname,
          lastname: salida.profesorId.lastname,
          imagen: professorImageUrl,
          bio: salida.profesorId.bio,
          telnumber: salida.profesorId.telnumber,
          rol: salida.profesorId.rol,
        };
      }

      return salidaObj as PopulatedSalidaSocial;
    } catch (error) {
      throw this.handleError(
        error,
        `buscar ${this.resourceName} con datos poblados`
      );
    }
  }

  /**
   * Find social events with filters and pagination
   */
  async findWithFilters(
    filters: SalidaSocialFilters = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ISalidaSocial[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // Build query filters
      const query: Record<string, any> = {};

      if (filters.deporte) query.deporte = filters.deporte;
      if (filters.localidad)
        query.localidad = new RegExp(filters.localidad, "i");
      if (filters.provincia) query.provincia = filters.provincia;
      if (filters.dificultad) query.dificultad = filters.dificultad;
      if (filters.fecha) query.fecha = filters.fecha;
      if (filters.creador_id) query.creador_id = filters.creador_id;

      // Price filters
      if (
        filters.precioMinimo !== undefined ||
        filters.precioMaximo !== undefined
      ) {
        query.precio = {};
        if (filters.precioMinimo !== undefined) {
          query.precio.$gte = filters.precioMinimo.toString();
        }
        if (filters.precioMaximo !== undefined) {
          query.precio.$lte = filters.precioMaximo.toString();
        }
      }

      return await this.findMany(
        query,
        {
          ...options,
          populate: ["creador_id"],
        },
        repositoryOptions
      );
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s con filtros`);
    }
  }

  /**
   * Find social events by creator with populated data
   */
  async findByCreator(
    creatorId: string,
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ISalidaSocial[]> {
    return this.findWithFilters(
      { creador_id: creatorId },
      {
        sort: { createdAt: -1 },
        ...options,
      },
      repositoryOptions
    );
  }

  /**
   * Find upcoming social events
   */
  async findUpcoming(
    options: {
      limit?: number;
      skip?: number;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ISalidaSocial[]> {
    const today = new Date().toISOString().split("T")[0];

    return this.findWithFilters(
      {},
      {
        sort: { fecha: 1, hora: 1 },
        ...options,
      },
      repositoryOptions
    );
  }

  /**
   * Find events by location coordinates (nearby events)
   */
  async findNearby(
    lat: number,
    lng: number,
    radiusInKm = 50,
    options: {
      limit?: number;
      skip?: number;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ISalidaSocial[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // This is a simplified proximity search
      // For production, consider using MongoDB's geospatial queries
      const latRange = radiusInKm / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngRange = radiusInKm / (111 * Math.cos((lat * Math.PI) / 180));

      const query = {
        "locationCoords.lat": {
          $gte: lat - latRange,
          $lte: lat + latRange,
        },
        "locationCoords.lng": {
          $gte: lng - lngRange,
          $lte: lng + lngRange,
        },
      };

      return await this.findMany(
        query,
        {
          sort: { createdAt: -1 },
          populate: ["creador_id"],
          ...options,
        },
        repositoryOptions
      );
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s cercanos`);
    }
  }

  /**
   * Get events statistics for a creator
   */
  async getCreatorStats(
    creatorId: string,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
  }> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      const [totalEvents, upcomingEvents, pastEvents] = await Promise.all([
        this.count({ creador_id: creatorId }, repositoryOptions),
        this.count(
          {
            creador_id: creatorId,
            fecha: { $gte: today },
          },
          repositoryOptions
        ),
        this.count(
          {
            creador_id: creatorId,
            fecha: { $lt: today },
          },
          repositoryOptions
        ),
      ]);

      return {
        totalEvents,
        upcomingEvents,
        pastEvents,
      };
    } catch (error) {
      throw this.handleError(error, `obtener estadísticas del creador`);
    }
  }

  /**
   * Create a new social event with image upload
   */
  async createWithImage(
    eventData: Partial<ISalidaSocial>,
    imageFile?: File,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ISalidaSocial> {
    const event = await this.create(eventData, repositoryOptions);

    if (imageFile) {
      try {
        const imageUrl = await ImageService.saveSocialImage(
          imageFile,
          event._id
        );
        return (await this.model
          .findByIdAndUpdate(event._id, { imagen: imageUrl }, { new: true })
          .exec()) as ISalidaSocial;
      } catch (error) {
        // Failed to upload image - return event without image
        return event;
      }
    }

    return event;
  }

  /**
   * Update social event with optional image upload
   */
  async updateWithImage(
    id: string,
    eventData: Partial<ISalidaSocial>,
    ownerId: string,
    imageFile?: File,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ISalidaSocial> {
    const updatedData = { ...eventData };

    if (imageFile) {
      try {
        const imageUrl = await ImageService.saveSocialImage(imageFile, id);
        updatedData.imagen = imageUrl;
      } catch (error) {
        // Failed to upload image - continue with update without new image
      }
    }

    return await this.updateWithOwnerCheck(
      id,
      updatedData,
      ownerId,
      "creador_id",
      repositoryOptions
    );
  }
}
