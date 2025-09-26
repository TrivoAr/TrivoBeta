import { BaseRepository, RepositoryOptions } from "./BaseRepository";
import Academia from "@/models/academia";
import Grupo from "@/models/grupo";
import User from "@/models/user";
import { Document } from "mongoose";
import { ImageService } from "@/libs/services/ImageService";

export interface IAcademia extends Document {
  _id: string;
  dueño_id: any;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
  descripcion?: string;
  tipo_disciplina: "Running" | "Trekking" | "Ciclismo" | "Otros";
  telefono?: string;
  imagen?: string;
  clase_gratis: boolean;
  precio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademiaFilters {
  tipo_disciplina?: string;
  localidad?: string;
  provincia?: string;
  pais?: string;
  clase_gratis?: boolean;
  dueño_id?: string;
  precioMinimo?: number;
  precioMaximo?: number;
}

export interface PopulatedAcademia extends Omit<IAcademia, "dueño_id"> {
  dueño_id: {
    _id: string;
    firstname: string;
    lastname: string;
    telnumber?: string;
    instagram?: string;
    imagen: string;
  };
}

export interface AcademiaWithGroups extends PopulatedAcademia {
  grupos: any[];
}

/**
 * Repository for Academia operations
 * Extends BaseRepository with academy-specific functionality
 */
export class AcademiaRepository extends BaseRepository<IAcademia> {
  constructor() {
    super(Academia, "Academia");
  }

  /**
   * Find an academy with populated owner data and profile image
   */
  async findWithPopulatedData(
    id: string,
    options: RepositoryOptions = {}
  ): Promise<PopulatedAcademia> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      const academia = await this.model
        .findById(id)
        .populate("dueño_id")
        .exec();

      if (!academia) {
        throw this.handleError(
          new Error("Not found"),
          `buscar ${this.resourceName} por ID`
        );
      }

      // Get owner profile image with fallback
      let ownerImageUrl: string;
      try {
        ownerImageUrl = await ImageService.getProfileImageWithFallback(
          academia.dueño_id._id.toString(),
          academia.dueño_id.firstname
        );
      } catch (error) {
        console.log(
          `[AcademiaRepository] Image fetch failed for owner:`,
          error
        );
        ownerImageUrl =
          "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";
      }

      // Create the response object with owner info
      const ownerInfo = {
        _id: academia.dueño_id._id,
        firstname: academia.dueño_id.firstname,
        lastname: academia.dueño_id.lastname,
        telnumber: academia.dueño_id.telnumber,
        instagram: academia.dueño_id.instagram,
        imagen: ownerImageUrl,
      };

      const responseAcademia = {
        ...academia.toObject(),
        dueño_id: ownerInfo,
      };

      return responseAcademia as PopulatedAcademia;
    } catch (error) {
      throw this.handleError(
        error,
        `buscar ${this.resourceName} con datos poblados`
      );
    }
  }

  /**
   * Find an academy with its groups
   */
  async findWithGroups(
    id: string,
    options: RepositoryOptions = {}
  ): Promise<AcademiaWithGroups> {
    const academia = await this.findWithPopulatedData(id, options);

    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // Find the groups for this academy
      const grupos = await Grupo.find({ academia_id: id });

      return {
        ...academia,
        grupos,
      } as AcademiaWithGroups;
    } catch (error) {
      throw this.handleError(error, `buscar grupos de ${this.resourceName}`);
    }
  }

  /**
   * Find academies with filters and pagination
   */
  async findWithFilters(
    filters: AcademiaFilters = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      // Build query filters
      const query: Record<string, any> = {};

      if (filters.tipo_disciplina)
        query.tipo_disciplina = filters.tipo_disciplina;
      if (filters.localidad)
        query.localidad = new RegExp(filters.localidad, "i");
      if (filters.provincia) query.provincia = filters.provincia;
      if (filters.pais) query.pais = filters.pais;
      if (filters.clase_gratis !== undefined)
        query.clase_gratis = filters.clase_gratis;
      if (filters.dueño_id) query.dueño_id = filters.dueño_id;

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
          populate: ["dueño_id"],
        },
        repositoryOptions
      );
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s con filtros`);
    }
  }

  /**
   * Find academies by owner
   */
  async findByOwner(
    ownerId: string,
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia[]> {
    return this.findWithFilters(
      { dueño_id: ownerId },
      {
        sort: { createdAt: -1 },
        ...options,
      },
      repositoryOptions
    );
  }

  /**
   * Find academies by location
   */
  async findByLocation(
    provincia?: string,
    localidad?: string,
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia[]> {
    const filters: AcademiaFilters = {};
    if (provincia) filters.provincia = provincia;
    if (localidad) filters.localidad = localidad;

    return this.findWithFilters(
      filters,
      {
        sort: { nombre_academia: 1 },
        ...options,
      },
      repositoryOptions
    );
  }

  /**
   * Find academies by discipline type
   */
  async findByDiscipline(
    tipo_disciplina: string,
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia[]> {
    return this.findWithFilters(
      { tipo_disciplina },
      {
        sort: { nombre_academia: 1 },
        ...options,
      },
      repositoryOptions
    );
  }

  /**
   * Get academy statistics for an owner
   */
  async getOwnerStats(
    ownerId: string,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<{
    totalAcademies: number;
    academiesByDiscipline: Record<string, number>;
    totalGroups: number;
  }> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      const academias = await this.findByOwner(ownerId, {}, repositoryOptions);

      // Count academies by discipline
      const academiesByDiscipline = academias.reduce(
        (acc, academia) => {
          acc[academia.tipo_disciplina] =
            (acc[academia.tipo_disciplina] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Count total groups across all academies
      const academiaIds = academias.map((a) => a._id);
      const totalGroups = await Grupo.countDocuments({
        academia_id: { $in: academiaIds },
      });

      return {
        totalAcademies: academias.length,
        academiesByDiscipline,
        totalGroups,
      };
    } catch (error) {
      throw this.handleError(error, `obtener estadísticas del propietario`);
    }
  }

  /**
   * Create a new academy with image upload
   */
  async createWithImage(
    academiaData: Partial<IAcademia>,
    imageFile?: File,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia> {
    const academia = await this.create(academiaData, repositoryOptions);

    if (imageFile) {
      try {
        const imageUrl = await ImageService.saveAcademyImage(
          imageFile,
          academia._id
        );
        return (await this.model
          .findByIdAndUpdate(academia._id, { imagen: imageUrl }, { new: true })
          .exec()) as IAcademia;
      } catch (error) {
        console.error("[AcademiaRepository] Failed to upload image:", error);
        // Return academia without image rather than failing completely
        return academia;
      }
    }

    return academia;
  }

  /**
   * Update academy with optional image upload
   */
  async updateWithImage(
    id: string,
    academiaData: Partial<IAcademia>,
    ownerId: string,
    imageFile?: File,
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia> {
    const updatedData = { ...academiaData };

    if (imageFile) {
      try {
        const imageUrl = await ImageService.saveAcademyImage(imageFile, id);
        updatedData.imagen = imageUrl;
      } catch (error) {
        console.error("[AcademiaRepository] Failed to upload image:", error);
        // Continue with update without new image
      }
    }

    return await this.updateWithOwnerCheck(
      id,
      updatedData,
      ownerId,
      "dueño_id",
      repositoryOptions
    );
  }

  /**
   * Search academies by name or description
   */
  async search(
    searchTerm: string,
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<IAcademia[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      const searchRegex = new RegExp(searchTerm, "i");
      const query = {
        $or: [{ nombre_academia: searchRegex }, { descripcion: searchRegex }],
      };

      return await this.findMany(
        query,
        {
          sort: { nombre_academia: 1 },
          populate: ["dueño_id"],
          ...options,
        },
        repositoryOptions
      );
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s por término`);
    }
  }
}
