import { BaseRepository, RepositoryOptions } from './BaseRepository';
import TeamSocial from '@/models/teamSocial';
import User from '@/models/user';
import Bares from '@/models/bares';
import Sponsors from '@/models/sponsors';
import { Document } from 'mongoose';
import { ImageService } from '@/libs/services/ImageService';

export interface ITeamSocial extends Document {
  _id: string;
  nombre: string;
  ubicacion: string;
  precio: string;
  deporte: string;
  fecha: string;
  hora: string;
  duracion: string;
  whatsappLink?: string;
  telefonoOrganizador?: string;
  localidad?: string;
  descripcion?: string;
  imagen?: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  creadorId: any;
  cupo: number;
  stravaActivity?: any;
  stravaMap?: {
    id?: string;
    summary_polyline?: string;
    polyline?: string;
    resource_state?: number;
  };
  cbu?: string;
  bar?: any;
  sponsors?: any[];
  provincia?: string;
  dificultad?: string;
  alias?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSocialFilters {
  deporte?: string;
  localidad?: string;
  provincia?: string;
  dificultad?: string;
  fecha?: string;
  precioMinimo?: number;
  precioMaximo?: number;
  creadorId?: string;
  conCupos?: boolean;
}

export interface PopulatedTeamSocial extends Omit<ITeamSocial, 'creadorId' | 'bar'> {
  creadorId: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    imagen: string;
  };
  bar?: any;
  sponsors?: any[];
}

/**
 * Repository for TeamSocial (Team Events) operations
 * Extends BaseRepository with team event-specific functionality
 */
export class TeamSocialRepository extends BaseRepository<ITeamSocial> {
  constructor() {
    super(TeamSocial, 'Team Social');
  }

  /**
   * Find a team social event with all populated data and profile images
   */
  async findWithPopulatedData(id: string, options: RepositoryOptions = {}): Promise<PopulatedTeamSocial> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // Ensure models are registered
      console.log("Ensuring models are registered...");
      console.log("User model:", User.modelName);
      console.log("Bares model:", Bares.modelName);
      console.log("Sponsors model:", Sponsors.modelName);

      const team = await this.model.findById(id)
        .populate("creadorId", "firstname lastname imagen")
        .exec();

      if (!team) {
        throw this.handleError(new Error('Not found'), `buscar ${this.resourceName} por ID`);
      }

      const teamObj = team.toObject() as any;

      // Get bar and sponsors data separately to avoid populate issues
      let barData = null;
      let sponsorsData = [];

      if (team.bar) {
        try {
          barData = await Bares.findById(team.bar);
        } catch (error) {
          console.log("Error loading bar:", error);
        }
      }

      if (team.sponsors && team.sponsors.length > 0) {
        try {
          sponsorsData = await Sponsors.find({ _id: { $in: team.sponsors } });
        } catch (error) {
          console.log("Error loading sponsors:", error);
        }
      }

      // Get creator profile image with fallback
      let creatorImageUrl: string;
      try {
        creatorImageUrl = await ImageService.getProfileImageWithFallback(
          team.creadorId._id.toString(),
          team.creadorId.firstname
        );
      } catch (error) {
        console.log(`[TeamSocialRepository] Image fetch failed for creator:`, error);
        creatorImageUrl = ImageService.generateAvatarUrl(team.creadorId.firstname);
      }

      // Update creator info with image
      teamObj.creadorId = {
        _id: team.creadorId._id,
        firstname: team.creadorId.firstname,
        lastname: team.creadorId.lastname,
        email: team.creadorId.email,
        imagen: creatorImageUrl,
      };

      // Add separately fetched data
      teamObj.bar = barData;
      teamObj.sponsors = sponsorsData;

      return teamObj as PopulatedTeamSocial;
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName} con datos poblados`);
    }
  }

  /**
   * Find team social events with filters and pagination
   */
  async findWithFilters(
    filters: TeamSocialFilters = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ITeamSocial[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // Build query filters
      const query: Record<string, any> = {};

      if (filters.deporte) query.deporte = filters.deporte;
      if (filters.localidad) query.localidad = new RegExp(filters.localidad, 'i');
      if (filters.provincia) query.provincia = filters.provincia;
      if (filters.dificultad) query.dificultad = filters.dificultad;
      if (filters.fecha) query.fecha = filters.fecha;
      if (filters.creadorId) query.creadorId = filters.creadorId;

      // Price filters
      if (filters.precioMinimo !== undefined || filters.precioMaximo !== undefined) {
        query.precio = {};
        if (filters.precioMinimo !== undefined) {
          query.precio.$gte = filters.precioMinimo.toString();
        }
        if (filters.precioMaximo !== undefined) {
          query.precio.$lte = filters.precioMaximo.toString();
        }
      }

      return await this.findMany(query, {
        ...options,
        populate: ['creadorId']
      }, repositoryOptions);
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s con filtros`);
    }
  }

  /**
   * Find team social events by creator with populated data
   */
  async findByCreator(
    creatorId: string,
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ITeamSocial[]> {
    return this.findWithFilters(
      { creadorId: creatorId },
      {
        sort: { createdAt: -1 },
        ...options
      },
      repositoryOptions
    );
  }

  /**
   * Find upcoming team social events
   */
  async findUpcoming(
    options: {
      limit?: number;
      skip?: number;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ITeamSocial[]> {
    return this.findWithFilters(
      {},
      {
        sort: { fecha: 1, hora: 1 },
        ...options
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
    radiusInKm: number = 50,
    options: {
      limit?: number;
      skip?: number;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ITeamSocial[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // This is a simplified proximity search
      // For production, consider using MongoDB's geospatial queries
      const latRange = radiusInKm / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngRange = radiusInKm / (111 * Math.cos(lat * Math.PI / 180));

      const query = {
        'locationCoords.lat': {
          $gte: lat - latRange,
          $lte: lat + latRange
        },
        'locationCoords.lng': {
          $gte: lng - lngRange,
          $lte: lng + lngRange
        }
      };

      return await this.findMany(query, {
        sort: { createdAt: -1 },
        populate: ['creadorId'],
        ...options
      }, repositoryOptions);
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s cercanos`);
    }
  }

  /**
   * Get team events statistics for a creator
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
      const today = new Date().toISOString().split('T')[0];

      const [totalEvents, upcomingEvents, pastEvents] = await Promise.all([
        this.count({ creadorId: creatorId }, repositoryOptions),
        this.count({
          creadorId: creatorId,
          fecha: { $gte: today }
        }, repositoryOptions),
        this.count({
          creadorId: creatorId,
          fecha: { $lt: today }
        }, repositoryOptions)
      ]);

      return {
        totalEvents,
        upcomingEvents,
        pastEvents
      };
    } catch (error) {
      throw this.handleError(error, `obtener estadísticas del creador`);
    }
  }

  /**
   * Create a new team social event with image upload
   */
  async createWithImage(
    eventData: Partial<ITeamSocial>,
    imageFile?: File,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ITeamSocial> {
    const event = await this.create(eventData, repositoryOptions);

    if (imageFile) {
      try {
        const imageUrl = await ImageService.saveTeamSocialImage(imageFile, event._id);
        return await this.model.findByIdAndUpdate(
          event._id,
          { imagen: imageUrl },
          { new: true }
        ).exec() as ITeamSocial;
      } catch (error) {
        console.error('[TeamSocialRepository] Failed to upload image:', error);
        // Return event without image rather than failing completely
        return event;
      }
    }

    return event;
  }

  /**
   * Update team social event with optional image upload
   */
  async updateWithImage(
    id: string,
    eventData: Partial<ITeamSocial>,
    ownerId: string,
    imageFile?: File,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<ITeamSocial> {
    let updatedData = { ...eventData };

    if (imageFile) {
      try {
        const imageUrl = await ImageService.saveTeamSocialImage(imageFile, id);
        updatedData.imagen = imageUrl;
      } catch (error) {
        console.error('[TeamSocialRepository] Failed to upload image:', error);
        // Continue with update without new image
      }
    }

    return await this.updateWithOwnerCheck(
      id,
      updatedData,
      ownerId,
      'creadorId',
      repositoryOptions
    );
  }
}