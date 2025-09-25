import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

jest.mock('axios');

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={null}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe('EventCard', () => {
  const baseEvent = {
    _id: '1',
    title: 'Test Event',
    date: '2024-12-25',
    time: '19:30',
    price: '100',
    image: 'https://example.com/image.jpg',
    location: 'Test Location',
    creadorId: 'creator-1',
    localidad: 'Test City',
    category: 'running',
    dificultad: 'intermedio',
    cupo: 10,
    fecha: '2024-12-25',
    hora: '19:30',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render base event card correctly', () => {
    render(<EventCard event={baseEvent} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
    expect(screen.getByText('running · intermedio')).toBeInTheDocument();
    expect(screen.getByText('Unirse')).toBeInTheDocument();
  });

  it('should render night event with night theme', () => {
    const nightEvent = {
      ...baseEvent,
      time: '21:00',
      hora: '21:00',
    };

    render(<EventCard event={nightEvent} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Noche')).toBeInTheDocument();
    expect(screen.getByText('Viví la experiencia nocturna')).toBeInTheDocument();
  });

  it('should render night variant when explicitly set', () => {
    render(<EventCard event={baseEvent} variant="night" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Noche')).toBeInTheDocument();
    expect(screen.getByText('Viví la experiencia nocturna')).toBeInTheDocument();
  });

  it('should display price correctly', () => {
    render(<EventCard event={baseEvent} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('should display "Gratis" for zero price', () => {
    const freeEvent = { ...baseEvent, price: '0' };

    render(<EventCard event={freeEvent} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('should have correct data-theme attribute for night events', () => {
    const nightEvent = {
      ...baseEvent,
      time: '21:00',
      hora: '21:00',
    };

    const { container } = render(<EventCard event={nightEvent} />, {
      wrapper: createWrapper(),
    });

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveAttribute('data-theme', 'night');
  });

  it('should not have data-theme attribute for day events', () => {
    const { container } = render(<EventCard event={baseEvent} />, {
      wrapper: createWrapper(),
    });

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).not.toHaveAttribute('data-theme');
  });

  it('should apply night theme classes correctly', () => {
    const nightEvent = {
      ...baseEvent,
      time: '21:00',
      hora: '21:00',
    };

    const { container } = render(<EventCard event={nightEvent} />, {
      wrapper: createWrapper(),
    });

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('theme-bg-secondary');
    expect(cardElement).toHaveClass('theme-glow');
    expect(cardElement).toHaveClass('night-pulse');
  });

  it('should display cupos information', () => {
    render(<EventCard event={baseEvent} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Cupos:/)).toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalEvent = {
      _id: '1',
      title: 'Minimal Event',
      date: '2024-12-25',
      time: '19:30',
      image: 'https://example.com/image.jpg',
      location: 'Test Location',
      creadorId: 'creator-1',
      localidad: 'Test City',
      category: 'running',
      cupo: 10,
    };

    expect(() => {
      render(<EventCard event={minimalEvent as any} />, {
        wrapper: createWrapper(),
      });
    }).not.toThrow();
  });
});