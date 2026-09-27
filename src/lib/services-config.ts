import React from 'react';
import {
  FiDollarSign,
  FiMap,
  FiFileText,
  FiHome,
  FiTool,
  FiTruck,
  FiBriefcase,
  FiGlobe,
} from 'react-icons/fi';

export interface InquiryField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea' | 'date';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  gridSpan?: 'full' | 'half';
}

/**
 * Visual identity for service pages. Colors are injected as CSS custom
 * properties on the service page root (see the pf-* classes in globals.css).
 * All services share the VectorAfriq system palette (brand red #468AD1 +
 * slate #514f63 family) so service pages stay consistent with the rest of
 * the site; layouts differentiate the pages instead.
 */
export interface ServiceTheme {
  id: string;
  name: string;
  /** Main accent color (buttons, highlights, links) */
  primary: string;
  /** Darker accent used for hover states */
  primaryDark: string;
  /** Decorative glow / blob color */
  glow: string;
  /** Dark shades of the system palette used for dark panels & hero overlays */
  surface: [string, string, string];
}

/**
 * Distinct page layouts so service pages don't just change color —
 * they change structure too.
 *  - centered: classic centered hero, horizontal 5-step process, card grid
 *  - sidecar: split hero with a floating "what's included" card, vertical timeline
 *  - featured: bold hero with service-type pills, bento feature grid, glass panels
 */
export type ServiceLayout = 'centered' | 'sidecar' | 'featured';

/**
 * Injects a service theme as CSS custom properties consumed by the pf-* classes
 * in globals.css. Set on the page root (or per-card) to scope a theme locally.
 */
export function themeStyleFor(t: ServiceTheme): React.CSSProperties {
  return {
    '--pf-primary': t.primary,
    '--pf-primary-dark': t.primaryDark,
    '--pf-primary-soft': `${t.primary}1A`,
    '--pf-primary-soft-strong': `${t.primary}4D`,
    '--pf-primary-ring': `${t.primary}33`,
    '--pf-primary-shadow': `${t.primary}33`,
    '--pf-primary-shadow-strong': `${t.primary}4D`,
    '--pf-glow': t.glow,
    '--pf-surface': t.surface[0],
    '--pf-surface-soft': `${t.surface[0]}0D`,
    '--pf-surface-soft-strong': `${t.surface[0]}1A`,
    '--pf-gradient-dark': `linear-gradient(135deg, ${t.surface[0]}, ${t.surface[1]}, ${t.surface[2]})`,
    '--pf-gradient-cta': `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})`,
  } as React.CSSProperties;
}

/* ═══════════════ System Palette ═══════════════
   All services share the VectorAfriq brand palette used across the site:
   - #468AD1  brand red (buttons, links, highlights, focus rings)
   - #2F6FAE  darker red for hover states
   - #fb7185  light rose tint of the brand red (decorative glows/icons)
   - #514f63 / #454358 / #3d3b4e  slate hero gradient (dark panels, overlays) */

const SYSTEM_THEME: Omit<ServiceTheme, 'id' | 'name'> = {
  primary: '#468AD1',
  primaryDark: '#2F6FAE',
  glow: '#fb7185',
  surface: ['#514f63', '#454358', '#3d3b4e'],
};

const makeTheme = (id: string, name: string): ServiceTheme => ({
  id,
  name,
  ...SYSTEM_THEME,
});

export const themes: Record<string, ServiceTheme> = {
  valuation: makeTheme('valuation', 'Valuation'),
  survey: makeTheme('survey', 'Survey'),
  legal: makeTheme('legal', 'Legal'),
  mortgage: makeTheme('mortgage', 'Mortgage'),
  architecture: makeTheme('architecture', 'Architecture'),
  movers: makeTheme('movers', 'Movers'),
  management: makeTheme('management', 'Management'),
  diaspora: makeTheme('diaspora', 'Diaspora'),
};

export interface ServiceConfig {
  slug: string;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
  heroImage: string;
  heroDescription: string;
  metaDescription: string;
  features: string[];
  benefits: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  serviceTypes: { value: string; label: string }[];
  inquiryFields: InquiryField[];
  /** Visual identity (system palette) for this service page */
  theme: ServiceTheme;
  /** Distinct page layout variant */
  layout: ServiceLayout;
}

export const services: ServiceConfig[] = [
  {
    slug: 'property-valuation',
    theme: themes.valuation,
    layout: 'centered',
    title: 'Property Valuation',
    shortTitle: 'Valuation',
    icon: React.createElement(FiDollarSign, { className: 'w-8 h-8' }),
    heroImage: '/services-images/property-valuation-hero-bg.jpeg',
    heroDescription:
      'Get accurate, certified property valuations from vetted professionals. Whether for sale, purchase, mortgage, or investment — VectorAfriq connects you with registered valuers you can trust.',
    metaDescription:
      'Professional property valuation services in Kenya. Certified valuers for market, mortgage, forced sale, and investment valuations via VectorAfriq.',
    features: [
      'Market valuation',
      'Forced sale valuation',
      'Mortgage valuation',
      'Insurance valuation',
      'Investment advisory',
      'Red Book valuation',
    ],
    benefits: [
      {
        title: 'Registered Valuers',
        description:
          'All valuers are registered with the Valuers Registration Board of Kenya and aligned with ISK standards.',
      },
      {
        title: 'Certified Reports',
        description:
          'Receive professional valuation reports accepted by banks, insurers, and regulatory bodies.',
      },
      {
        title: 'Managed Process',
        description:
          'VectorAfriq manages the entire process — from inquiry to quote to final report delivery.',
      },
      {
        title: 'Fast Turnaround',
        description:
          'Standard valuations delivered within 5–7 business days. Expedited options available.',
      },
    ],
    faqs: [
      {
        question: 'What types of property valuations do you offer?',
        answer:
          'We offer market valuation, forced sale valuation, mortgage valuation, insurance valuation, investment advisory, and Red Book valuations for all property types including residential, commercial, and agricultural land.',
      },
      {
        question: 'How long does a valuation take?',
        answer:
          'Standard property valuations are completed within 5–7 business days after site inspection. Expedited valuations can be arranged for urgent requirements at an additional fee.',
      },
      {
        question: 'Are your valuations accepted by banks?',
        answer:
          'Yes. All valuations are conducted by registered valuers and produce reports accepted by all major banks, financial institutions, and regulatory bodies in Kenya.',
      },
      {
        question: 'How much does a property valuation cost?',
        answer:
          'Costs vary based on property type, location, and valuation purpose. Submit an inquiry with your details and we will provide a tailored quote within 24 hours.',
      },
      {
        question: 'Can I get a valuation for agricultural land?',
        answer:
          'Absolutely. Our network includes valuers who specialize in agricultural land, tea/coffee estates, ranches, and other rural properties across Kenya.',
      },
    ],
    serviceTypes: [
      { value: 'market-valuation', label: 'Market Valuation' },
      { value: 'forced-sale-valuation', label: 'Forced Sale Valuation' },
      { value: 'mortgage-valuation', label: 'Mortgage Valuation' },
      { value: 'insurance-valuation', label: 'Insurance Valuation' },
      { value: 'investment-advisory', label: 'Investment Advisory' },
      { value: 'red-book-valuation', label: 'Red Book Valuation' },
    ],
    inquiryFields: [
      { name: 'propertyType', label: 'Property Type', type: 'select', required: true, options: [
        { value: 'apartment', label: 'Apartment' }, { value: 'house', label: 'House / Villa' }, { value: 'townhouse', label: 'Townhouse' }, { value: 'land', label: 'Land' }, { value: 'commercial', label: 'Commercial' }, { value: 'agricultural', label: 'Agricultural' },
      ]},
      { name: 'estimatedValue', label: 'Estimated Property Value', type: 'text', required: true, placeholder: 'e.g. KES 15,000,000' },
      { name: 'valuationPurpose', label: 'Valuation Purpose', type: 'select', required: true, options: [
        { value: 'sale-purchase', label: 'Sale / Purchase' }, { value: 'mortgage', label: 'Mortgage' }, { value: 'insurance', label: 'Insurance' }, { value: 'investment', label: 'Investment' }, { value: 'legal', label: 'Legal / Dispute' },
      ]},
      { name: 'bedrooms', label: 'Number of Bedrooms', type: 'number', required: false, placeholder: 'e.g. 3' },
    ],
  },
  {
    slug: 'survey-mapping',
    theme: themes.survey,
    layout: 'sidecar',
    title: 'Survey & Mapping',
    shortTitle: 'Survey',
    icon: React.createElement(FiMap, { className: 'w-8 h-8' }),
    heroImage: '/services-images/survey-hero-bg.jpeg',
    heroDescription:
      'Professional land surveying and mapping services delivered through VectorAfriq\'s vetted partner network of licensed surveyors across Kenya.',
    metaDescription:
      'Professional survey and mapping services in Kenya. Boundary surveys, beacon placement, subdivision, and topographic mapping via VectorAfriq.',
    features: [
      'Boundary confirmation',
      'Beacon placement & verification',
      'Land subdivision',
      'Topographic mapping',
      'Site analysis',
      'Cadastral mapping',
    ],
    benefits: [
      {
        title: 'Licensed Surveyors',
        description:
          'All surveyors are registered with the Institution of Surveyors of Kenya (ISK) and licensed by the relevant authorities.',
      },
      {
        title: 'Accurate Results',
        description:
          'State-of-the-art GPS and GIS equipment ensures precision in every survey and map delivered.',
      },
      {
        title: 'End-to-End Management',
        description:
          'VectorAfriq handles scheduling, coordination, and quality assurance for every survey project.',
      },
      {
        title: 'Government Accepted',
        description: 'Survey plans and reports are accepted by the Ministry of Lands and relevant government agencies.',
      },
    ],
    faqs: [
      {
        question: 'What survey services are available?',
        answer:
          'We offer boundary confirmation, beacon placement and verification, land subdivision, topographic mapping, site analysis, and cadastral mapping services.',
      },
      {
        question: 'How long does a boundary survey take?',
        answer:
          'A standard boundary survey takes 1–2 weeks depending on property size, location complexity, and weather conditions.',
      },
      {
        question: 'Do I need a survey before selling my property?',
        answer:
          'A boundary survey is highly recommended before any property transaction. It confirms exact boundaries, prevents disputes, and adds value to your listing.',
      },
      {
        question: 'Can surveyors handle large-scale subdivision projects?',
        answer:
          'Yes. Our network includes surveyors experienced in residential estates, commercial developments, and agricultural subdivisions of any scale.',
      },
    ],
    serviceTypes: [
      { value: 'boundary-survey', label: 'Boundary Survey' },
      { value: 'beacon-placement', label: 'Beacon Placement' },
      { value: 'land-subdivision', label: 'Land Subdivision' },
      { value: 'topographic-mapping', label: 'Topographic Mapping' },
      { value: 'site-analysis', label: 'Site Analysis' },
      { value: 'cadastral-mapping', label: 'Cadastral Mapping' },
    ],
    inquiryFields: [
      { name: 'surveyType', label: 'Survey Type', type: 'select', required: true, options: [
        { value: 'boundary', label: 'Boundary Survey' }, { value: 'beacon', label: 'Beacon Placement / Verification' }, { value: 'subdivision', label: 'Land Subdivision' }, { value: 'topographic', label: 'Topographic Mapping' }, { value: 'site-analysis', label: 'Site Analysis' }, { value: 'cadastral', label: 'Cadastral Mapping' },
      ]},
      { name: 'landSize', label: 'Approximate Land Size', type: 'text', required: true, placeholder: 'e.g. 0.5 acres, 200 sqm' },
      { name: 'plotCount', label: 'Number of Plots', type: 'number', required: false, placeholder: 'e.g. 3' },
    ],
  },
  {
    slug: 'legal-conveyancing',
    theme: themes.legal,
    layout: 'featured',
    title: 'Legal / Conveyancing',
    shortTitle: 'Legal',
    icon: React.createElement(FiFileText, { className: 'w-8 h-8' }),
    heroImage: '/services-images/legal-conveyancing-hero-bg.jpeg',
    heroDescription:
      'Expert legal services for property transactions — from title verification to conveyancing. VectorAfriq connects you with experienced property lawyers who protect your interests.',
    metaDescription:
      'Professional legal and conveyancing services in Kenya. Title verification, sale agreements, land search, and ownership transfer via VectorAfriq.',
    features: [
      'Title deed verification',
      'Sale agreement drafting',
      'Land search via ArdhiSasa',
      'Conveyancing',
      'Ownership transfer',
      'Land dispute resolution',
    ],
    benefits: [
      {
        title: 'Verified Lawyers',
        description:
          'All legal professionals are verified and aligned with the Law Society of Kenya standards.',
      },
      {
        title: 'Secure Transactions',
        description:
          'Every transaction is managed through VectorAfriq for transparency, security, and proper documentation.',
      },
      {
        title: 'Comprehensive Service',
        description:
          'From initial land search to final transfer, we cover every legal step in the property transaction process.',
      },
      {
        title: 'Dispute Support',
        description:
          'Access to legal professionals who specialize in land disputes and boundary conflicts.',
      },
    ],
    faqs: [
      {
        question: 'What legal services are available for property transactions?',
        answer:
          'Our services include title deed verification, sale agreement drafting, land search via ArdhiSasa, conveyancing, ownership transfer processing, and land dispute resolution.',
      },
      {
        question: 'How does the conveyancing process work?',
        answer:
          'Once you submit an inquiry, VectorAfriq reviews your needs, provides a quote, and assigns a verified conveyancing lawyer. They handle the entire transfer process including documentation, stamp duty, and registration.',
      },
      {
        question: 'How long does a property transfer take?',
        answer:
          'A standard property transfer (conveyancing) takes 2–4 weeks depending on the complexity, location, and government processing times.',
      },
      {
        question: 'Can you help with land disputes?',
        answer:
          'Yes. Our network includes lawyers who specialize in land disputes, boundary conflicts, succession matters, and other property-related legal issues.',
      },
      {
        question: 'What is a land search and why do I need one?',
        answer:
          'A land search verifies the legal owner, size, encumbrances, and status of a property at the Ministry of Lands. It is a critical due diligence step before any property transaction.',
      },
    ],
    serviceTypes: [
      { value: 'title-verification', label: 'Title Verification' },
      { value: 'sale-agreement', label: 'Sale Agreement Drafting' },
      { value: 'land-search', label: 'Land Search (ArdhiSasa)' },
      { value: 'conveyancing', label: 'Conveyancing' },
      { value: 'ownership-transfer', label: 'Ownership Transfer' },
      { value: 'land-dispute', label: 'Land Dispute Resolution' },
    ],
    inquiryFields: [
      { name: 'transactionType', label: 'Transaction Type', type: 'select', required: true, options: [
        { value: 'purchase', label: 'Purchase' }, { value: 'sale', label: 'Sale' }, { value: 'transfer', label: 'Transfer' }, { value: 'lease', label: 'Lease' }, { value: 'dispute', label: 'Dispute Resolution' },
      ]},
      { name: 'propertyValueRange', label: 'Property Value Range', type: 'select', required: true, options: [
        { value: 'under-5m', label: 'Under KES 5M' }, { value: '5m-15m', label: 'KES 5M – 15M' }, { value: '15m-30m', label: 'KES 15M – 30M' }, { value: '30m-50m', label: 'KES 30M – 50M' }, { value: 'over-50m', label: 'Over KES 50M' },
      ]},
      { name: 'partiesInvolved', label: 'Number of Parties Involved', type: 'number', required: false, placeholder: 'e.g. 2' },
    ],
  },
  {
    slug: 'mortgage-assistance',
    theme: themes.mortgage,
    layout: 'sidecar',
    title: 'Mortgage Assistance',
    shortTitle: 'Mortgage',
    icon: React.createElement(FiHome, { className: 'w-8 h-8' }),
    heroImage: '/services-images/mortgage-hero-bg.jpeg',
    heroDescription:
      'Navigate the mortgage process with expert guidance. VectorAfriq connects you with mortgage advisors and valuation experts to secure the best financing for your property.',
    metaDescription:
      'Mortgage assistance services in Kenya. Expert mortgage advisory, bank comparison, pre-approval guidance, and property valuation for mortgage via VectorAfriq.',
    features: [
      'Mortgage pre-approval guidance',
      'Bank & product comparison',
      'Affordability assessment',
      'Mortgage valuation reports',
      'Application support',
      'Refinancing advisory',
    ],
    benefits: [
      {
        title: 'Expert Advisors',
        description:
          'Work with experienced mortgage advisors who understand the Kenyan lending landscape and can match you with the right product.',
      },
      {
        title: 'Bank Comparison',
        description:
          'Get unbiased comparison of mortgage products from multiple banks and financial institutions.',
      },
      {
        title: 'Valuation Support',
        description:
          'VectorAfriq arranges the required mortgage valuation through our network of registered valuers.',
      },
      {
        title: 'End-to-End Guidance',
        description:
          'From initial affordability assessment to final disbursement, we guide you through every step.',
      },
    ],
    faqs: [
      {
        question: 'How does the mortgage assistance service work?',
        answer:
          'Submit an inquiry with your property details and financing needs. Our mortgage advisors review your case, compare products from multiple banks, and guide you through the application process.',
      },
      {
        question: 'Do I need a property valuation for a mortgage?',
        answer:
          'Yes. All banks require a valuation report before approving a mortgage. VectorAfriq can arrange this through our network of registered valuers.',
      },
      {
        question: 'What documents do I need for a mortgage application?',
        answer:
          'Typically you will need: national ID/passport, KRA PIN, salary slips (3–6 months), bank statements (6 months), employer letter, and the property documents. Requirements may vary by bank.',
      },
      {
        question: 'Can you help with mortgage refinancing?',
        answer:
          'Yes. Our advisors can assess your current mortgage, compare refinancing options across banks, and guide you through the transfer process to secure better terms.',
      },
    ],
    serviceTypes: [
      { value: 'pre-approval-guidance', label: 'Pre-Approval Guidance' },
      { value: 'bank-comparison', label: 'Bank & Product Comparison' },
      { value: 'affordability-assessment', label: 'Affordability Assessment' },
      { value: 'mortgage-valuation', label: 'Mortgage Valuation' },
      { value: 'application-support', label: 'Application Support' },
      { value: 'refinancing-advisory', label: 'Refinancing Advisory' },
    ],
    inquiryFields: [
      { name: 'incomeRange', label: 'Monthly Income Range', type: 'select', required: true, options: [
        { value: 'under-100k', label: 'Under KES 100K' }, { value: '100k-250k', label: 'KES 100K – 250K' }, { value: '250k-500k', label: 'KES 250K – 500K' }, { value: '500k-1m', label: 'KES 500K – 1M' }, { value: 'over-1m', label: 'Over KES 1M' },
      ]},
      { name: 'loanAmount', label: 'Desired Loan Amount', type: 'select', required: true, options: [
        { value: 'under-5m', label: 'Under KES 5M' }, { value: '5m-10m', label: 'KES 5M – 10M' }, { value: '10m-20m', label: 'KES 10M – 20M' }, { value: '20m-50m', label: 'KES 20M – 50M' }, { value: 'over-50m', label: 'Over KES 50M' },
      ]},
      { name: 'employmentType', label: 'Employment Type', type: 'select', required: true, options: [
        { value: 'employed', label: 'Employed' }, { value: 'self-employed', label: 'Self-Employed' }, { value: 'business-owner', label: 'Business Owner' }, { value: 'retired', label: 'Retired' },
      ]},
    ],
  },
  {
    slug: 'architectural-construction',
    theme: themes.architecture,
    layout: 'centered',
    title: 'Architectural & Construction Services',
    shortTitle: 'Architecture',
    icon: React.createElement(FiTool, { className: 'w-8 h-8' }),
    heroImage: '/services-images/Professional Architectural & Construction Services Services in Kenya Architectural & Construction Services hero bg.jpeg',
    heroDescription:
      'From architectural design to construction supervision — VectorAfriq connects you with certified architects, engineers, and contractors to bring your property vision to life.',
    metaDescription:
      'Architectural and construction services in Kenya. Architect design, structural engineering, quantity surveying, and construction supervision via VectorAfriq.',
    features: [
      'Architectural design',
      'Structural engineering',
      'Quantity surveying',
      'Bill of quantities',
      'Construction supervision',
      'Project management',
    ],
    benefits: [
      {
        title: 'Certified Professionals',
        description:
          'All architects and engineers are registered with the Board of Registration of Architects and Quantity Surveyors (BORAQS).',
      },
      {
        title: 'End-to-End Projects',
        description:
          'From concept design through to construction completion, VectorAfriq manages the entire project lifecycle.',
      },
      {
        title: 'Cost Transparency',
        description:
          'Receive detailed bills of quantities and project estimates before any work begins.',
      },
      {
        title: 'Quality Assurance',
        description:
          'Regular site inspections and progress reports ensure your project meets the highest standards.',
      },
    ],
    faqs: [
      {
        question: 'What architectural services do you offer?',
        answer:
          'We offer architectural design (residential and commercial), structural engineering, quantity surveying, bill of quantities preparation, construction supervision, and full project management.',
      },
      {
        question: 'How much does it cost to design a house in Kenya?',
        answer:
          'Architectural fees typically range from 6–10% of the construction cost for residential projects. Submit an inquiry with your project details for a specific quote.',
      },
      {
        question: 'Do you handle construction as well as design?',
        answer:
          'Yes. Our network includes vetted contractors and construction firms. VectorAfriq can manage the entire process from design through to construction completion.',
      },
      {
        question: 'Can I get a bill of quantities for my project?',
        answer:
          'Absolutely. Our quantity surveyors prepare detailed bills of quantities that break down material, labor, and equipment costs for accurate budgeting.',
      },
    ],
    serviceTypes: [
      { value: 'architectural-design', label: 'Architectural Design' },
      { value: 'structural-engineering', label: 'Structural Engineering' },
      { value: 'quantity-surveying', label: 'Quantity Surveying' },
      { value: 'bill-of-quantities', label: 'Bill of Quantities' },
      { value: 'construction-supervision', label: 'Construction Supervision' },
      { value: 'project-management', label: 'Project Management' },
    ],
    inquiryFields: [
      { name: 'projectType', label: 'Project Type', type: 'select', required: true, options: [
        { value: 'new-construction', label: 'New Construction' }, { value: 'renovation', label: 'Renovation' }, { value: 'extension', label: 'Extension' }, { value: 'interior-design', label: 'Interior Design' }, { value: 'commercial-fitout', label: 'Commercial Fit-out' },
      ]},
      { name: 'plotSize', label: 'Approximate Plot / Building Size', type: 'text', required: true, placeholder: 'e.g. 0.25 acres, 150 sqm' },
      { name: 'budgetRange', label: 'Budget Range', type: 'select', required: true, options: [
        { value: 'under-5m', label: 'Under KES 5M' }, { value: '5m-15m', label: 'KES 5M – 15M' }, { value: '15m-30m', label: 'KES 15M – 30M' }, { value: '30m-50m', label: 'KES 30M – 50M' }, { value: 'over-50m', label: 'Over KES 50M' },
      ]},
    ],
  },
  {
    slug: 'movers',
    theme: themes.movers,
    layout: 'featured',
    title: 'Movers',
    shortTitle: 'Movers',
    icon: React.createElement(FiTruck, { className: 'w-8 h-8' }),
    heroImage: '/services-images/movers hero bg.jpeg',
    heroDescription:
      'Professional moving and relocation services across Kenya. Find verified movers, get instant estimates, and track your move in real-time through VectorAfriq.',
    metaDescription:
      'Professional moving and relocation services in Kenya. Verified movers, instant pricing, real-time tracking via VectorAfriq.',
    features: [
      'Household relocation',
      'Office moving',
      'Vehicle transport',
      'Packing services',
      'Storage solutions',
      'Real-time tracking',
    ],
    benefits: [
      {
        title: 'Verified Movers',
        description:
          'All movers are vetted, insured, and rated by previous customers for reliability and professionalism.',
      },
      {
        title: 'Instant Estimates',
        description:
          'Get price estimates based on distance, load size, and vehicle type before committing to a mover.',
      },
      {
        title: 'Real-Time Tracking',
        description:
          'Track your move from pickup to delivery with live GPS updates and driver communication.',
      },
      {
        title: 'Secure Payment',
        description:
          'Payment is held in escrow and released to the mover only after successful delivery.',
      },
    ],
    faqs: [
      {
        question: 'How do I book a mover through VectorAfriq?',
        answer:
          'Visit the Movers page, enter your pickup and dropoff locations, select your load size, and browse verified movers. You can compare prices, ratings, and vehicle types before sending a request.',
      },
      {
        question: 'How are moving costs calculated?',
        answer:
          'Moving costs are based on the distance between pickup and dropoff, the weight and volume of your load, the vehicle type, and the mover\'s base rates. VectorAfriq provides an instant estimate.',
      },
      {
        question: 'Are my belongings insured during the move?',
        answer:
          'All verified movers on VectorAfriq carry basic insurance. You can request additional coverage for high-value items during the booking process.',
      },
      {
        question: 'Can I track my move in real-time?',
        answer:
          'Yes. Once a mover accepts your request and begins the pickup, you can track their location in real-time through the VectorAfriq platform.',
      },
    ],
    serviceTypes: [
      { value: 'household-relocation', label: 'Household Relocation' },
      { value: 'office-moving', label: 'Office Moving' },
      { value: 'vehicle-transport', label: 'Vehicle Transport' },
      { value: 'packing-services', label: 'Packing Services' },
      { value: 'storage-solutions', label: 'Storage Solutions' },
    ],
    inquiryFields: [
      { name: 'pickupLocation', label: 'Pickup Location', type: 'text', required: true, placeholder: 'e.g. Kilimani, Nairobi' },
      { name: 'dropoffLocation', label: 'Drop-off Location', type: 'text', required: true, placeholder: 'e.g. Nyali, Mombasa' },
      { name: 'loadSize', label: 'Load Size', type: 'select', required: true, options: [
        { value: 'few-items', label: 'Few Items' }, { value: 'small-room', label: 'Small Room' }, { value: '1-2-bedroom', label: '1–2 Bedroom' }, { value: '3-bedroom', label: '3+ Bedroom' }, { value: 'full-house', label: 'Full House' }, { value: 'office', label: 'Office' },
      ]},
      { name: 'preferredDate', label: 'Preferred Moving Date', type: 'date', required: true },
      { name: 'specialInstructions', label: 'Special Instructions', type: 'textarea', required: false, placeholder: 'Fragile items, piano, heavy furniture, etc.' },
    ],
  },
  {
    slug: 'property-management',
    theme: themes.management,
    layout: 'sidecar',
    title: 'Property Management',
    shortTitle: 'Management',
    icon: React.createElement(FiBriefcase, { className: 'w-8 h-8' }),
    heroImage: '/services-images/property-valuation-hero-bg.jpeg',
    heroDescription:
      'Professional property management services for landlords and investors. From tenant screening to maintenance — VectorAfriq keeps your property performing at its best.',
    metaDescription:
      'Professional property management services in Kenya. Tenant screening, rent collection, maintenance, and reporting via VectorAfriq.',
    features: [
      'Tenant screening & placement',
      'Rent collection & accounting',
      'Property maintenance',
      'Lease management',
      'Regular inspections',
      'Financial reporting',
    ],
    benefits: [
      {
        title: 'Maximize Returns',
        description:
          'Professional management ensures optimal rental pricing, minimal vacancies, and consistent income streams.',
      },
      {
        title: 'Thorough Screening',
        description:
          'Rigorous tenant screening including employment verification, references, and credit checks.',
      },
      {
        title: 'Maintenance Network',
        description:
          'Access to vetted contractors for prompt, quality maintenance and repairs at competitive rates.',
      },
      {
        title: 'Transparent Reporting',
        description:
          'Regular financial statements, inspection reports, and real-time portfolio dashboards.',
      },
    ],
    faqs: [
      {
        question: 'What does property management include?',
        answer:
          'Our property management service covers tenant screening and placement, rent collection, property maintenance, lease management, regular inspections, and financial reporting.',
      },
      {
        question: 'How much does property management cost?',
        answer:
          'Property management fees typically range from 8–12% of monthly rent. Contact us for a customized quote based on your property portfolio.',
      },
      {
        question: 'Do you handle commercial properties?',
        answer:
          'Yes. We manage both residential and commercial properties including apartments, office spaces, retail units, and mixed-use developments.',
      },
      {
        question: 'How do you screen tenants?',
        answer:
          'Our tenant screening process includes employment verification, income validation, reference checks, ID verification, and credit history review to ensure reliable tenancies.',
      },
    ],
    serviceTypes: [
      { value: 'tenant-screening', label: 'Tenant Screening & Placement' },
      { value: 'rent-collection', label: 'Rent Collection' },
      { value: 'property-maintenance', label: 'Property Maintenance' },
      { value: 'lease-management', label: 'Lease Management' },
      { value: 'inspections', label: 'Regular Inspections' },
      { value: 'financial-reporting', label: 'Financial Reporting' },
    ],
    inquiryFields: [
      { name: 'propertyType', label: 'Property Type', type: 'select', required: true, options: [
        { value: 'apartment', label: 'Apartment' }, { value: 'house', label: 'House' }, { value: 'commercial', label: 'Commercial' }, { value: 'mixed-use', label: 'Mixed-Use' },
      ]},
      { name: 'unitCount', label: 'Number of Units', type: 'number', required: true, placeholder: 'e.g. 5' },
      { name: 'occupancyStatus', label: 'Current Vacancy Status', type: 'select', required: true, options: [
        { value: 'fully-occupied', label: 'Fully Occupied' }, { value: 'partially-vacant', label: 'Partially Vacant' }, { value: 'fully-vacant', label: 'Fully Vacant' },
      ]},
      { name: 'rentRange', label: 'Monthly Rent Range per Unit', type: 'select', required: false, options: [
        { value: 'under-30k', label: 'Under KES 30K' }, { value: '30k-60k', label: 'KES 30K – 60K' }, { value: '60k-100k', label: 'KES 60K – 100K' }, { value: 'over-100k', label: 'Over KES 100K' },
      ]},
    ],
  },
  {
    slug: 'diaspora-services',
    theme: themes.diaspora,
    layout: 'centered',
    title: 'Diaspora Services',
    shortTitle: 'Diaspora',
    icon: React.createElement(FiGlobe, { className: 'w-8 h-8' }),
    heroImage: '/services-images/diaspora hero bg.jpeg',
    heroDescription:
      'Tailored property services for Kenyans in the diaspora. Buy, sell, manage, or invest in Kenyan property remotely with full support from VectorAfriq\'s trusted team.',
    metaDescription:
      'Property services for Kenyans abroad. Remote property buying, selling, management, and investment advisory via VectorAfriq.',
    features: [
      'Remote property buying',
      'Remote property selling',
      'Property management abroad',
      'Investment advisory',
      'Legal representation',
      'Diaspora mortgage guidance',
    ],
    benefits: [
      {
        title: 'Remote Management',
        description:
          'Handle every aspect of your property transaction remotely — from inquiry to completion — through our secure platform.',
      },
      {
        title: 'Trusted Representation',
        description:
          'VectorAfriq acts as your on-the-ground representative, verifying properties, professionals, and processes on your behalf.',
      },
      {
        title: 'Video Inspections',
        description:
          'Virtual property tours and live video inspections so you can see your property from anywhere in the world.',
      },
      {
        title: 'Diaspora Banking',
        description:
          'Guidance on diaspora-specific mortgage products, foreign exchange considerations, and cross-border payment facilitation.',
      },
    ],
    faqs: [
      {
        question: 'Can I buy property in Kenya from abroad?',
        answer:
          'Yes. VectorAfriq provides end-to-end remote buying services including property verification, legal due diligence, survey, and conveyancing — all managed through our platform so you never need to be physically present.',
      },
      {
        question: 'How do I verify a property remotely?',
        answer:
          'We offer live video inspections, drone surveys, professional photography, and detailed reports. Every property is verified by our team before any transaction proceeds.',
      },
      {
        question: 'Do you offer diaspora mortgage products?',
        answer:
          'Yes. Several Kenyan banks offer mortgage products specifically for diaspora clients. Our mortgage advisors can guide you through eligibility, documentation, and application.',
      },
      {
        question: 'Can you manage my property while I am abroad?',
        answer:
          'Absolutely. Our property management service is designed for diaspora investors — covering tenant screening, rent collection, maintenance, inspections, and monthly financial reporting.',
      },
      {
        question: 'How do payments work for diaspora clients?',
        answer:
          'We accept payments via international wire transfer, M-Pesa (for diaspora-enabled accounts), and other secure payment channels. All payments are held in escrow for your protection.',
      },
    ],
    serviceTypes: [
      { value: 'remote-buying', label: 'Remote Property Buying' },
      { value: 'remote-selling', label: 'Remote Property Selling' },
      { value: 'diaspora-management', label: 'Property Management' },
      { value: 'investment-advisory', label: 'Investment Advisory' },
      { value: 'legal-representation', label: 'Legal Representation' },
      { value: 'diaspora-mortgage', label: 'Diaspora Mortgage Guidance' },
    ],
    inquiryFields: [
      { name: 'countryOfResidence', label: 'Country of Residence', type: 'text', required: true, placeholder: 'e.g. United States' },
      { name: 'serviceInterest', label: 'Service Interest', type: 'select', required: true, options: [
        { value: 'buying', label: 'Buying Property' }, { value: 'selling', label: 'Selling Property' }, { value: 'management', label: 'Property Management' }, { value: 'investment', label: 'Investment Advisory' },
      ]},
      { name: 'preferredLocation', label: 'Preferred Location in Kenya', type: 'text', required: true, placeholder: 'e.g. Kilimani, Nairobi' },
      { name: 'budgetRange', label: 'Budget Range', type: 'select', required: false, options: [
        { value: 'under-5m', label: 'Under KES 5M' }, { value: '5m-15m', label: 'KES 5M – 15M' }, { value: '15m-30m', label: 'KES 15M – 30M' }, { value: '30m-50m', label: 'KES 30M – 50M' }, { value: 'over-50m', label: 'Over KES 50M' },
      ]},
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceConfig | undefined {
  return services.find((s) => s.slug === slug);
}

export const serviceSlugs = services.map((s) => s.slug);
