import { Model, Document, Types } from "mongoose";
import { connectDB } from "@/libs/mongodb";

export interface RepositoryOptions {
  requireConnection?: boolean;
}

export interface BaseRepositoryError extends Error {
  code?: string;
  statusCode?: number;
}

export class NotFoundError extends Error implements BaseRepositoryError {
  code = "NOT_FOUND";
  statusCode = 404;

  constructor(resource: string, id?: string) {
    super(
      id
        ? `${resource} con ID ${id} no encontrado`
        : `${resource} no encontrado`
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error implements BaseRepositoryError {
  code = "UNAUTHORIZED";
  statusCode = 403;

  constructor(action = "realizar esta acción") {
    super(`No tienes permiso para ${action}`);
    this.name = "UnauthorizedError";
  }
}

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;
  protected resourceName: string;

  constructor(model: Model<T>, resourceName: string) {
    this.model = model;
    this.resourceName = resourceName;
  }

  /**
   * Ensures database connection before operations
   */
  protected async ensureConnection(): Promise<void> {
    await connectDB();
  }

  /**
   * Find a document by ID with optional population
   */
  async findById(
    id: string,
    populate?: string[] | string,
    options: RepositoryOptions = {}
  ): Promise<T | null> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    // Validar que el ID sea un ObjectId válido
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError(this.resourceName, id);
    }

    try {
      let query = this.model.findById(id);

      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach((field) => (query = query.populate(field) as any));
        } else {
          query = query.populate(populate) as any;
        }
      }

      return await query.exec();
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName} por ID`);
    }
  }

  /**
   * Find a document by ID and ensure it exists
   */
  async findByIdOrThrow(
    id: string,
    populate?: string[] | string,
    options: RepositoryOptions = {}
  ): Promise<T> {
    const document = await this.findById(id, populate, options);

    if (!document) {
      throw new NotFoundError(this.resourceName, id);
    }

    return document;
  }

  /**
   * Find a document by ID and verify ownership
   */
  async findByIdWithOwnerCheck(
    id: string,
    ownerId: string,
    ownerField = "creador_id",
    options: RepositoryOptions = {}
  ): Promise<T> {
    const document = await this.findByIdOrThrow(id, undefined, options);

    const documentOwnerId = (document as any)[ownerField];
    if (documentOwnerId?.toString() !== ownerId) {
      throw new UnauthorizedError(`editar este ${this.resourceName}`);
    }

    return document;
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>, options: RepositoryOptions = {}): Promise<T> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw this.handleError(error, `crear ${this.resourceName}`);
    }
  }

  /**
   * Update a document by ID with ownership check
   */
  async updateWithOwnerCheck(
    id: string,
    data: Partial<T>,
    ownerId: string,
    ownerField = "creador_id",
    options: RepositoryOptions = {}
  ): Promise<T> {
    await this.findByIdWithOwnerCheck(id, ownerId, ownerField, options);

    try {
      const updated = await this.model
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .exec();

      if (!updated) {
        throw new NotFoundError(this.resourceName, id);
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof UnauthorizedError
      ) {
        throw error;
      }
      throw this.handleError(error, `actualizar ${this.resourceName}`);
    }
  }

  /**
   * Delete a document by ID with ownership check
   */
  async deleteWithOwnerCheck(
    id: string,
    ownerId: string,
    ownerField = "creador_id",
    options: RepositoryOptions = {}
  ): Promise<T> {
    await this.findByIdWithOwnerCheck(id, ownerId, ownerField, options);

    try {
      const deleted = await this.model.findByIdAndDelete(id).exec();

      if (!deleted) {
        throw new NotFoundError(this.resourceName, id);
      }

      return deleted;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof UnauthorizedError
      ) {
        throw error;
      }
      throw this.handleError(error, `eliminar ${this.resourceName}`);
    }
  }

  /**
   * Find documents with filters and pagination
   */
  async findMany(
    filters: Record<string, any> = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      populate?: string[] | string;
    } = {},
    repositoryOptions: RepositoryOptions = {}
  ): Promise<T[]> {
    if (repositoryOptions.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      let query = this.model.find(filters);

      if (options.limit) query = query.limit(options.limit);
      if (options.skip) query = query.skip(options.skip);
      if (options.sort) query = query.sort(options.sort);

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(
            (field) => (query = query.populate(field) as any)
          );
        } else {
          query = query.populate(options.populate) as any;
        }
      }

      return await query.exec();
    } catch (error) {
      throw this.handleError(error, `buscar ${this.resourceName}s`);
    }
  }

  /**
   * Count documents with filters
   */
  async count(
    filters: Record<string, any> = {},
    options: RepositoryOptions = {}
  ): Promise<number> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      return await this.model.countDocuments(filters).exec();
    } catch (error) {
      throw this.handleError(error, `contar ${this.resourceName}s`);
    }
  }

  /**
   * Check if a document exists
   */
  async exists(
    filters: Record<string, any>,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    if (options.requireConnection !== false) {
      await this.ensureConnection();
    }

    try {
      const document = await this.model.exists(filters).exec();
      return !!document;
    } catch (error) {
      throw this.handleError(
        error,
        `verificar existencia de ${this.resourceName}`
      );
    }
  }

  /**
   * Handle and standardize errors
   */
  protected handleError(error: any, operation: string): BaseRepositoryError {
    // Error handling in repository

    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return error;
    }

    // MongoDB duplicate key error
    if (error.code === 11000) {
      const duplicateError = new Error(
        "Ya existe un registro con estos datos"
      ) as BaseRepositoryError;
      duplicateError.code = "DUPLICATE_KEY";
      duplicateError.statusCode = 409;
      return duplicateError;
    }

    // MongoDB validation error
    if (error.name === "ValidationError") {
      const validationError = new Error(
        "Datos inválidos proporcionados"
      ) as BaseRepositoryError;
      validationError.code = "VALIDATION_ERROR";
      validationError.statusCode = 400;
      return validationError;
    }

    // Generic server error
    const serverError = new Error(
      `Error interno al ${operation}`
    ) as BaseRepositoryError;
    serverError.code = "INTERNAL_SERVER_ERROR";
    serverError.statusCode = 500;
    return serverError;
  }
}
