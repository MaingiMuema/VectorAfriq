# VectorAfriq

A modern real estate marketplace built with Next.js, TypeScript, and Tailwind CSS.

## Overview

VectorAfriq is Kenya's leading real estate platform, connecting buyers, sellers, and renters with the best properties across the country. The platform features a modern, responsive design with intuitive navigation and powerful search capabilities.

## Features

- 🏠 Property Listings (Sale, Rent, Airbnb)
- 🔍 Advanced Search with Filters
- 📍 Location-based Search
- 💼 Estate Agent Profiles
- 📱 Fully Responsive Design
- 📝 Property Blog & Advice
- 🗺️ Interactive Maps
- 📊 Market Insights

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Icons:** React Icons
- **Animations:** Tailwind Transitions
- **Deployment:** Vercel

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vectorafriqproperties.git
cd vectorafriqproperties
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Image Hosting

Images are hosted on cPanel with the following structure:

```
public_html/
├── images/
│   ├── properties/     # Property listing images
│   ├── agents/         # Agent profile photos
│   ├── blog/           # Blog post images
│   └── partners/       # Partner logos
```

### Image Guidelines

1. **Property Images:**
   - Format: JPEG/WebP
   - Resolution: 1200x800px (landscape)
   - Max size: 500KB
   - Naming: `property-{id}-{number}.jpg`

2. **Agent Photos:**
   - Format: JPEG/WebP
   - Resolution: 400x400px (square)
   - Max size: 200KB
   - Naming: `agent-{id}.jpg`

3. **Blog Images:**
   - Format: JPEG/WebP
   - Resolution: 1600x900px (16:9)
   - Max size: 800KB
   - Naming: `blog-{id}-{type}.jpg`

4. **Partner Logos:**
   - Format: PNG with transparency
   - Resolution: 300x200px
   - Max size: 100KB
   - Naming: `partner-{name}.png`

### Image URLs

Base URL structure:
```
https://yourdomain.com/images/{category}/{filename}
```

Update the `next.config.js` to include your cPanel domain in the image configuration:

```javascript
module.exports = {
  images: {
    domains: ['yourdomain.com'],
  },
}
```

## Project Structure

```
src/
├── app/                # Next.js app router pages
├── components/         # React components
│   ├── home/          # Home page components
│   └── layout/        # Layout components
├── lib/               # Utilities and helpers
├── types/             # TypeScript definitions
└── hooks/             # Custom React hooks
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Location: Kitengela : Tarikiville Mall, Mezzanine Floor, Suite M17
- Phone: +254 23310245
