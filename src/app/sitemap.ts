import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.guardiarealdeantioquia.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes: Array<{
    path:       string
    priority:   number
    changeFreq: MetadataRoute.Sitemap[number]['changeFrequency']
  }> = [
    { path: '/',          priority: 1.0, changeFreq: 'weekly'  },
    { path: '/nosotros',  priority: 0.9, changeFreq: 'monthly' },
    { path: '/servicios',  priority: 0.9, changeFreq: 'monthly' },
    { path: '/galeria',   priority: 0.7, changeFreq: 'weekly'  },
    { path: '/noticias',  priority: 0.8, changeFreq: 'weekly'  },
    { path: '/eventos',   priority: 0.8, changeFreq: 'weekly'  },
    { path: '/ingresos',  priority: 0.6, changeFreq: 'monthly' },
    { path: '/privacidad',priority: 0.3, changeFreq: 'yearly'  },
    { path: '/terminos',  priority: 0.3, changeFreq: 'yearly'  },
  ]

  return routes.map(r => ({
    url:           `${SITE_URL}${r.path}`,
    lastModified:  now,
    changeFrequency: r.changeFreq,
    priority:      r.priority,
  }))
}
