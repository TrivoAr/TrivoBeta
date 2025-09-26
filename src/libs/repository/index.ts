// Base repository exports
export {
  BaseRepository,
  NotFoundError,
  UnauthorizedError,
} from "./BaseRepository";
export type { RepositoryOptions, BaseRepositoryError } from "./BaseRepository";

// Specific repository exports
import { SalidaSocialRepository } from "./SalidaSocialRepository";
export { SalidaSocialRepository };
export type {
  ISalidaSocial,
  SalidaSocialFilters,
  PopulatedSalidaSocial,
} from "./SalidaSocialRepository";

import { TeamSocialRepository } from "./TeamSocialRepository";
export { TeamSocialRepository };
export type {
  ITeamSocial,
  TeamSocialFilters,
  PopulatedTeamSocial,
} from "./TeamSocialRepository";

import { AcademiaRepository } from "./AcademiaRepository";
export { AcademiaRepository };
export type {
  IAcademia,
  AcademiaFilters,
  PopulatedAcademia,
  AcademiaWithGroups,
} from "./AcademiaRepository";

/**
 * Factory function to get repository instances
 * Follows the factory pattern for consistent repository creation
 */
export class RepositoryFactory {
  private static instances = new Map();

  static getSalidaSocialRepository(): SalidaSocialRepository {
    if (!this.instances.has("SalidaSocial")) {
      this.instances.set("SalidaSocial", new SalidaSocialRepository());
    }
    return this.instances.get("SalidaSocial");
  }

  static getTeamSocialRepository(): TeamSocialRepository {
    if (!this.instances.has("TeamSocial")) {
      this.instances.set("TeamSocial", new TeamSocialRepository());
    }
    return this.instances.get("TeamSocial");
  }

  static getAcademiaRepository(): AcademiaRepository {
    if (!this.instances.has("Academia")) {
      this.instances.set("Academia", new AcademiaRepository());
    }
    return this.instances.get("Academia");
  }

  /**
   * Get repository by entity type
   */
  static getRepository(entityType: "social" | "team-social" | "academia") {
    switch (entityType) {
      case "social":
        return this.getSalidaSocialRepository();
      case "team-social":
        return this.getTeamSocialRepository();
      case "academia":
        return this.getAcademiaRepository();
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Clear all repository instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}
