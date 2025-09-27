"use client";

import React from "react";
import { DashboardCard } from "@/components/Dashboard/DashboardCard";
import dayjs from "dayjs";

/**
 * Interfaces para las secciones del dashboard
 */
interface BaseItem {
  _id: string;
  nombre?: string;
  nombre_academia?: string;
  imagen?: string;
  imagenUrl?: string;
  deporte?: string;
  tipo_disciplina?: string;
  ubicacion?: string;
  localidad?: string;
  fecha?: string;
  hora?: string;
  precio?: string;
  creador_id?: string;
  dueño_id?: string;
}

interface SectionProps<T extends BaseItem> {
  items: T[];
  title: string;
  createRoute: string;
  onCreateNew: () => void;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewMembers?: (id: string) => void;
  onScanQR?: (id: string) => void;
  emptyMessage?: string;
  showActions?: boolean;
  currentUserId?: string;
}

/**
 * Componente base para secciones del dashboard
 */
function DashboardSection<T extends BaseItem>({
  items,
  title,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onViewMembers,
  onScanQR,
  emptyMessage = `No has creado ${title.toLowerCase()} aún`,
  showActions = true,
  currentUserId,
}: SectionProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <button
          onClick={onCreateNew}
          className="text-sm px-3 py-1 bg-[#C95100] text-white rounded-[15px] hover:bg-[#A03D00] transition-colors"
        >
          + Nueva
        </button>
      </div>

      {items.length > 0 ? (
        items.map((item) => {
          // Determinar si el usuario es el propietario del item
          const isOwner =
            currentUserId &&
            (item.creador_id === currentUserId ||
              item.dueño_id === currentUserId);

          return (
            <DashboardCard
              key={item._id}
              id={item._id}
              title={item.nombre || item.nombre_academia || ""}
              image={item.imagen || item.imagenUrl}
              category={item.deporte || item.tipo_disciplina}
              location={item.ubicacion || ""}
              localidad={item.localidad}
              date={
                item.fecha ? dayjs(item.fecha).format("DD/MM/YYYY") : undefined
              }
              time={item.hora}
              fecha={item.fecha}
              hora={item.hora}
              price={item.precio}
              type={
                item.nombre_academia
                  ? "academia"
                  : item.deporte
                    ? "salida"
                    : "team"
              }
              showActions={showActions}
              isOwner={isOwner}
              onClick={() => onView(item._id)}
              onEdit={onEdit ? () => onEdit(item._id) : undefined}
              onDelete={onDelete ? () => onDelete(item._id) : undefined}
              onViewMembers={
                onViewMembers ? () => onViewMembers(item._id) : undefined
              }
              onScanQR={
                onScanQR && isOwner ? () => onScanQR(item._id) : undefined
              }
            />
          );
        })
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </div>
  );
}

/**
 * Estado vacío reutilizable
 */
interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon = (
    <div className="text-muted-foreground mb-4">
      <svg
        className="mx-auto h-16 w-16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  ),
}) => (
  <div className="text-center py-8 text-muted-foreground bg-muted rounded-[20px]">
    {icon}
    <p>{message}</p>
  </div>
);

/**
 * Sección específica para Academias
 */
interface Academia extends BaseItem {
  nombre_academia: string;
  tipo_disciplina: string;
  imagenUrl: string;
}

export interface AcademiasSectionProps {
  academias: Academia[];
  onCreateNew: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewMembers: (id: string) => void;
}

export const AcademiasSection: React.FC<AcademiasSectionProps> = (props) => (
  <DashboardSection
    {...props}
    items={props.academias}
    title="Mis Academias"
    createRoute="/academias/crear"
    emptyMessage="No has creado academias aún"
  />
);

/**
 * Sección específica para Salidas Sociales
 */
interface SalidaSocial extends BaseItem {
  nombre: string;
  deporte: string;
  imagen: string;
}

export interface SalidasSocialesSectionProps {
  salidas: SalidaSocial[];
  onCreateNew: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewMembers: (id: string) => void;
}

export const SalidasSocialesSection: React.FC<SalidasSocialesSectionProps> = (
  props
) => (
  <DashboardSection
    {...props}
    items={props.salidas}
    title="Mis Salidas Sociales"
    createRoute="/social/crear"
    emptyMessage="No has creado salidas sociales aún"
  />
);

/**
 * Sección específica para Team Sociales
 */
interface TeamSocial extends BaseItem {
  nombre: string;
  deporte: string;
  imagen: string;
}

export interface TeamSocialesSectionProps {
  teams: TeamSocial[];
  onCreateNew: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewMembers: (id: string) => void;
}

export const TeamSocialesSection: React.FC<TeamSocialesSectionProps> = (
  props
) => (
  <DashboardSection
    {...props}
    items={props.teams}
    title="Mis Socials Teams"
    createRoute="/team-social/crear"
    emptyMessage="No has creado team socials aún"
  />
);

/**
 * Sección para Matches
 */
interface MatchItem extends Omit<BaseItem, "creador_id"> {
  nombre: string;
  deporte: string;
  imagen: string;
  creador_id?:
    | string
    | {
        firstname: string;
        lastname: string;
      };
}

export interface MatchesSectionProps {
  miMatchSalidas: MatchItem[];
  miMatchTeams: MatchItem[];
  onView: (id: string, type: "social" | "team") => void;
  onExploreEvents: () => void;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  miMatchSalidas,
  miMatchTeams,
  onView,
  onExploreEvents,
}) => {
  const totalMatches = miMatchSalidas.length + miMatchTeams.length;

  if (totalMatches === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium">No tienes matches activos</p>
        <p className="text-sm mt-2">
          Únete a salidas y teams para ver tus matches aquí
        </p>
        <button
          onClick={onExploreEvents}
          className="mt-4 px-4 py-2 bg-[#C95100] text-white rounded-[20px] hover:bg-[#A03D00] transition-colors"
        >
          Explorar Eventos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Salidas Sociales Matches */}
      {miMatchSalidas.map((salida) => (
        <DashboardCard
          key={salida._id}
          id={salida._id}
          title={salida.nombre}
          image={salida.imagen}
          category={salida.deporte}
          location={salida.ubicacion}
          localidad={salida.localidad}
          date={
            salida.fecha ? dayjs(salida.fecha).format("DD/MM/YYYY") : undefined
          }
          time={salida.hora}
          price={salida.precio}
          teacher={
            salida.creador_id && typeof salida.creador_id === "object"
              ? `${salida.creador_id.firstname} ${salida.creador_id.lastname}`
              : undefined
          }
          type="salida"
          onClick={() => onView(salida._id, "social")}
          showActions={false}
        />
      ))}

      {/* Teams Sociales Matches */}
      {miMatchTeams.map((team) => (
        <DashboardCard
          key={team._id}
          id={team._id}
          title={team.nombre}
          image={team.imagen}
          category={team.deporte}
          location={team.ubicacion}
          localidad={team.localidad}
          date={team.fecha ? dayjs(team.fecha).format("DD/MM/YYYY") : undefined}
          time={team.hora}
          price={team.precio}
          type="team"
          onClick={() => onView(team._id, "team")}
          showActions={false}
        />
      ))}
    </div>
  );
};

/**
 * Sección para Favoritos
 */
interface FavoritoItem extends Omit<BaseItem, "creador_id"> {
  nombre?: string;
  nombre_academia?: string;
  deporte?: string;
  tipo_disciplina?: string;
  creador_id?:
    | string
    | {
        firstname: string;
        lastname: string;
      };
}

export interface FavoritosSectionProps {
  favoritosAcademias: FavoritoItem[];
  favoritosSalidas: FavoritoItem[];
  favoritosTeams: FavoritoItem[];
  onView: (id: string, type: "academias" | "social" | "team") => void;
  onToggleFavorite: (
    tipo: "academias" | "sociales" | "teamsocial",
    id: string
  ) => void;
  onExploreEvents: () => void;
}

export const FavoritosSection: React.FC<FavoritosSectionProps> = ({
  favoritosAcademias,
  favoritosSalidas,
  favoritosTeams,
  onView,
  onToggleFavorite,
  onExploreEvents,
}) => {
  const totalFavoritos =
    favoritosAcademias.length + favoritosSalidas.length + favoritosTeams.length;

  if (totalFavoritos === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium">No tienes favoritos guardados</p>
        <p className="text-sm mt-2">
          Explora y marca como favoritos las salidas, teams y academias que te
          interesen
        </p>
        <button
          onClick={onExploreEvents}
          className="mt-4 px-4 py-2 bg-[#C95100] text-white rounded-[20px] hover:bg-[#A03D00] transition-colors"
        >
          Explorar Eventos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Academias Favoritas */}
      {favoritosAcademias.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Mis Academias Favoritas
          </h3>
          {favoritosAcademias.map((academia) => (
            <DashboardCard
              key={academia._id}
              id={academia._id}
              title={academia.nombre_academia || ""}
              image={academia.imagenUrl}
              category={academia.tipo_disciplina}
              location=""
              localidad={academia.localidad}
              price={academia.precio}
              type="academia"
              onClick={() => onView(academia._id, "academias")}
              showActions={true}
              isFavorite={true}
              onToggleFavorite={() =>
                onToggleFavorite("academias", academia._id)
              }
            />
          ))}
        </div>
      )}

      {/* Salidas Sociales Favoritas */}
      {favoritosSalidas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Mis Salidas Sociales Favoritas
          </h3>
          {favoritosSalidas.map((salida) => (
            <DashboardCard
              key={salida._id}
              id={salida._id}
              title={salida.nombre || ""}
              image={salida.imagen}
              category={salida.deporte}
              location={salida.ubicacion}
              localidad={salida.localidad}
              date={
                salida.fecha
                  ? dayjs(salida.fecha).format("DD/MM/YYYY")
                  : undefined
              }
              time={salida.hora}
              price={salida.precio}
              teacher={
                salida.creador_id && typeof salida.creador_id === "object"
                  ? `${salida.creador_id.firstname} ${salida.creador_id.lastname}`
                  : undefined
              }
              type="salida"
              onClick={() => onView(salida._id, "social")}
              showActions={true}
              isFavorite={true}
              onToggleFavorite={() => onToggleFavorite("sociales", salida._id)}
            />
          ))}
        </div>
      )}

      {/* Teams Sociales Favoritos */}
      {favoritosTeams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Mis Teams Sociales Favoritos
          </h3>
          {favoritosTeams.map((team) => (
            <DashboardCard
              key={team._id}
              id={team._id}
              title={team.nombre || ""}
              image={team.imagen}
              category={team.deporte}
              location={team.ubicacion}
              localidad={team.localidad}
              date={
                team.fecha ? dayjs(team.fecha).format("DD/MM/YYYY") : undefined
              }
              time={team.hora}
              price={team.precio}
              type="team"
              onClick={() => onView(team._id, "team")}
              showActions={true}
              isFavorite={true}
              onToggleFavorite={() => onToggleFavorite("teamsocial", team._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
