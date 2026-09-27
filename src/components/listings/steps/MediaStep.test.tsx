import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import MediaStep from './MediaStep';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('MediaStep', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    data: {
      images: [],
      videos: [],
      virtualTour: '',
    },
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area correctly', () => {
    render(<MediaStep {...defaultProps} />);

    expect(screen.getByText('Property Images')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop images here, or click to select files')).toBeInTheDocument();
    expect(screen.getByText('Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP')).toBeInTheDocument();
  });

  it('validates file size correctly', async () => {
    render(<MediaStep {...defaultProps} />);

    // Create a mock file that's too large (6MB)
    const largeFile = new File([''], 'large-image.jpg', {
      type: 'image/jpeg',
      size: 6 * 1024 * 1024, // 6MB
    });

    const input = screen.getByRole('textbox', { hidden: true });

    // Simulate file drop
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('File "large-image.jpg" is too large. Maximum size is 5MB.')
      );
    });
  });

  it('validates file type correctly', async () => {
    render(<MediaStep {...defaultProps} />);

    // Create a mock file with unsupported type
    const invalidFile = new File([''], 'document.pdf', {
      type: 'application/pdf',
    });

    const input = screen.getByRole('textbox', { hidden: true });

    // Simulate file drop
    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('File "document.pdf" is not a supported image format. Use JPEG, PNG, or WebP.')
      );
    });
  });

  it('processes valid files correctly', async () => {
    render(<MediaStep {...defaultProps} />);

    // Create a valid mock file
    const validFile = new File([''], 'valid-image.jpg', {
      type: 'image/jpeg',
      size: 1024 * 1024, // 1MB
    });

    const input = screen.getByRole('textbox', { hidden: true });

    // Simulate file drop
    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        images: expect.arrayContaining([
          expect.objectContaining({
            name: 'valid-image.jpg',
            type: 'image/jpeg',
            preview: 'mock-url',
            id: expect.any(String),
          }),
        ]),
      });
      expect(toast.success).toHaveBeenCalledWith('Added 1 image(s)');
    });
  });

  it('shows processing state during file upload', async () => {
    render(<MediaStep {...defaultProps} />);

    const validFile = new File([''], 'test.jpg', {
      type: 'image/jpeg',
      size: 1024,
    });

    const input = screen.getByRole('textbox', { hidden: true });
    fireEvent.change(input, { target: { files: [validFile] } });

    // Should show processing state briefly
    expect(screen.getByText('Processing files...')).toBeInTheDocument();
  });

  it('removes images correctly and cleans up object URLs', () => {
    const imageWithPreview = {
      name: 'test.jpg',
      type: 'image/jpeg',
      size: 1024,
      preview: 'mock-url',
      id: 'test-id',
    } as File & { preview: string; id: string };

    const propsWithImage = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        images: [imageWithPreview],
      },
    };

    render(<MediaStep {...propsWithImage} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    expect(mockOnChange).toHaveBeenCalledWith({ images: [] });
    expect(toast.success).toHaveBeenCalledWith('Image removed');
  });

  it('shows file count limit correctly', () => {
    const propsWithImages = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        images: new Array(15).fill(null).map((_, i) => ({
          name: `image-${i}.jpg`,
          type: 'image/jpeg',
          size: 1024,
          id: `id-${i}`,
        })),
      },
    };

    render(<MediaStep {...propsWithImages} />);

    expect(screen.getByText('Maximum 5 more images can be added')).toBeInTheDocument();
  });
});
