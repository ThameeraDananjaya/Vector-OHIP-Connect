import Link from 'next/link';
import { 
  ArrowRight, 
  Cloud, 
  Zap, 
  Shield, 
  Globe, 
  Database, 
  Code,
  Hotel,
  BarChart3,
  Settings,
  Layers,
  Workflow
} from 'lucide-react';

const features = [
  {
    icon: Cloud,
    title: 'Cloud-Native Architecture',
    description: 'Built on Oracle Cloud Infrastructure with Kubernetes, providing high scalability and secure handling of high throughput.'
  },
  {
    icon: Zap,
    title: 'Real-Time Event Streaming',
    description: 'Push notifications via streaming API technology for instant updates on reservations, check-ins, and housekeeping changes.'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Fine-grained OAuth 2.0 authentication with application-key based access control. Hotels maintain full control over API access.'
  },
  {
    icon: Globe,
    title: 'Global Compliance',
    description: 'Fiscal and legal compliance with language and currency support in 200+ countries and territories.'
  },
  {
    icon: Database,
    title: '3,000+ REST APIs',
    description: 'Comprehensive API coverage for reservations, profiles, inventory, rates, housekeeping, and back-office operations.'
  },
  {
    icon: Code,
    title: 'Developer-First Experience',
    description: 'Self-service portal with interactive documentation, Postman collections, and sandbox testing environments.'
  }
];

const modules = [
  {
    id: 'distribution',
    name: 'Distribution',
    icon: Globe,
    endpoints: 153,
    description: 'Channel management, availability, and booking distribution'
  },
  {
    id: 'property',
    name: 'OPERA Property',
    icon: Hotel,
    endpoints: 2410,
    description: 'Complete property management including reservations, profiles, and inventory'
  },
  {
    id: 'workflows',
    name: 'OPERA Workflows',
    icon: Workflow,
    endpoints: 276,
    description: 'Pre-built workflow patterns for common hospitality operations'
  },
  {
    id: 'nor1',
    name: 'Nor1 Upgrade',
    icon: Layers,
    endpoints: 4,
    description: 'Upsell and upgrade offer management'
  },
  {
    id: 'ra_data',
    name: 'R&A Data APIs',
    icon: BarChart3,
    endpoints: 68,
    description: 'Reporting and analytics data access'
  },
  {
    id: 'ra_storage',
    name: 'R&A Object Storage',
    icon: Database,
    endpoints: 5,
    description: 'Analytics data object storage access'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--redwood-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--redwood-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--oracle-red)] flex items-center justify-center">
                <span className="text-white font-bold text-xs">Vector</span>
              </div>
              <span className="font-semibold text-[var(--oracle-dark)] text-lg">OHIP Connect</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link 
                href="/app" 
                className="px-4 py-2 rounded-lg bg-[var(--oracle-red)] text-white font-medium hover:bg-[var(--redwood-secondary)] transition-colors flex items-center gap-2"
              >
                Launch App <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--oracle-red)]/5 via-transparent to-[var(--redwood-secondary)]/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--oracle-red)]/10 text-[var(--oracle-red)] text-sm font-medium mb-6">
              <Cloud className="w-4 h-4" />
              Oracle Hospitality Integration Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--oracle-dark)] mb-6 leading-tight">
              Unlock the Power of
              <span className="text-[var(--oracle-red)]"> OPERA Cloud</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Test, explore, and integrate with Oracle Hospitality APIs. A comprehensive interface 
              for managing hospitality integrations across OPERA Cloud, Distribution, and Analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/app" 
                className="px-8 py-4 rounded-xl bg-[var(--oracle-red)] text-white font-semibold hover:bg-[var(--redwood-secondary)] transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/app?tab=setup" 
                className="px-8 py-4 rounded-xl bg-white text-[var(--oracle-dark)] font-semibold border-2 border-[var(--redwood-border)] hover:border-[var(--oracle-red)] transition-all flex items-center gap-2"
              >
                <Settings className="w-5 h-5" /> Configure Environment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-[var(--redwood-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '3,000+', label: 'REST APIs' },
              { value: '6', label: 'API Modules' },
              { value: '325', label: 'Environment Variables' },
              { value: '200+', label: 'Countries Supported' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[var(--oracle-red)]">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--oracle-dark)] mb-4">API Modules</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore comprehensive API collections covering all aspects of hospitality operations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Link 
                key={module.id}
                href={`/app?tab=${module.id}`}
                className="group bg-white rounded-xl p-6 border border-[var(--redwood-border)] hover:border-[var(--oracle-red)] hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--oracle-red)]/10 flex items-center justify-center group-hover:bg-[var(--oracle-red)] transition-colors">
                    <module.icon className="w-6 h-6 text-[var(--oracle-red)] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--oracle-dark)] text-lg mb-1">{module.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    <div className="inline-flex items-center text-sm font-medium text-[var(--oracle-red)]">
                      {module.endpoints} endpoints <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--oracle-dark)] mb-4">Why OHIP?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The Oracle Hospitality Integration Platform simplifies and accelerates integrations 
              with an open, developer-friendly architecture
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-[var(--redwood-bg)] border border-[var(--redwood-border)] hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-[var(--oracle-red)]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[var(--oracle-red)]" />
                </div>
                <h3 className="font-semibold text-[var(--oracle-dark)] text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--oracle-red)] to-[var(--redwood-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Integrating?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Configure your environment credentials and start exploring Oracle Hospitality APIs today
          </p>
          <Link 
            href="/app?tab=setup" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[var(--oracle-red)] font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            <Settings className="w-5 h-5" /> Configure Environment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[var(--oracle-dark)] text-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[var(--oracle-red)] flex items-center justify-center">
                <span className="text-white font-bold text-xs">V</span>
              </div>
              <span className="text-white/80">Vector OHIP Connect</span>
            </div>
            <p className="text-sm">
              Oracle Hospitality Integration Platform API Testing Interface
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
