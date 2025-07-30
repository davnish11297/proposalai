import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const client = await Client.findOne({
      _id: params.id,
      organizationId: userAuth.organizationId,
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Enrich client data from multiple sources
    const enrichedData = await enrichClientData(client);

    // Update client with enriched data
    const updatedClient = await Client.findByIdAndUpdate(
      params.id,
      {
        $set: {
          ...enrichedData,
          lastEnrichmentDate: new Date(),
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Client data enriched successfully',
    });

  } catch (error) {
    console.error('Client enrichment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enrich client data' },
      { status: 500 }
    );
  }
}

async function enrichClientData(client: any): Promise<any> {
  const enrichedData: any = {};

  try {
    // Company enrichment (simulated - replace with real API like Clearbit)
    if (client.company && client.website) {
      const companyData = await enrichCompanyData(client.company, client.website);
      Object.assign(enrichedData, companyData);
    }

    // Contact enrichment from LinkedIn/social media
    if (client.email) {
      const contactData = await enrichContactData(client.email, client.name);
      Object.assign(enrichedData, contactData);
    }

    // News and intelligence gathering
    if (client.company) {
      const newsData = await enrichNewsData(client.company);
      Object.assign(enrichedData, newsData);
    }

    // Industry analysis
    if (client.industry || enrichedData.industry) {
      const industryData = await enrichIndustryData(client.industry || enrichedData.industry);
      Object.assign(enrichedData, industryData);
    }

    return enrichedData;

  } catch (error) {
    console.error('Error enriching client data:', error);
    return {};
  }
}

// Company data enrichment
async function enrichCompanyData(companyName: string, website?: string): Promise<any> {
  try {
    // This would typically use APIs like:
    // - Clearbit Company API
    // - Companies House API
    // - LinkedIn Company API
    // - Crunchbase API
    
    // For demo purposes, returning simulated data
    const mockData = {
      companySize: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'][Math.floor(Math.random() * 6)],
      industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Consulting'][Math.floor(Math.random() * 6)],
      annualRevenue: '$' + (Math.floor(Math.random() * 100) + 10) + 'M',
      foundedYear: 2000 + Math.floor(Math.random() * 23),
      headquarters: {
        city: ['New York', 'San Francisco', 'London', 'Toronto', 'Austin'][Math.floor(Math.random() * 5)],
        country: 'USA'
      },
      description: `${companyName} is a leading company in their industry with innovative solutions and strong market presence.`,
      technologies: ['React', 'Node.js', 'AWS', 'MongoDB', 'TypeScript'].slice(0, Math.floor(Math.random() * 3) + 2),
      socialMedia: {
        linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `@${companyName.toLowerCase().replace(/\s+/g, '')}`,
      },
      enrichmentSource: 'Company Database',
      enrichmentTimestamp: new Date(),
    };

    return mockData;

  } catch (error) {
    console.error('Company enrichment error:', error);
    return {};
  }
}

// Contact data enrichment
async function enrichContactData(email: string, name: string): Promise<any> {
  try {
    // This would typically use APIs like:
    // - Clearbit Person API
    // - Hunter.io
    // - LinkedIn Sales Navigator API
    // - Fullcontact API
    
    // For demo purposes, returning simulated data
    const domain = email.split('@')[1];
    const mockData = {
      jobTitle: ['CEO', 'CTO', 'VP Sales', 'Director', 'Manager', 'Senior Developer'][Math.floor(Math.random() * 6)],
      department: ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance'][Math.floor(Math.random() * 5)],
      phoneNumber: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
      alternateEmails: [`${name.toLowerCase().replace(/\s+/g, '.')}@${domain}`],
      socialProfiles: {
        linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `@${name.toLowerCase().replace(/\s+/g, '')}`,
      },
      lastSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
      enrichmentSource: 'Contact Database',
    };

    return mockData;

  } catch (error) {
    console.error('Contact enrichment error:', error);
    return {};
  }
}

// News and intelligence data
async function enrichNewsData(companyName: string): Promise<any> {
  try {
    // This would typically use APIs like:
    // - News API
    // - Google News API
    // - Bing News API
    // - Company press releases
    
    // For demo purposes, returning simulated recent news
    const newsTypes = ['funding', 'acquisition', 'product-launch', 'partnership', 'expansion'];
    const randomNewsType = newsTypes[Math.floor(Math.random() * newsTypes.length)];
    
    const mockNews = {
      recentNews: [
        {
          title: `${companyName} Announces ${randomNewsType === 'funding' ? 'Series A Funding' : 'Strategic Partnership'}`,
          summary: `Recent development shows ${companyName} is expanding their market presence and capabilities.`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          source: 'Business News',
          sentiment: 'positive',
          category: randomNewsType,
        }
      ],
      marketPosition: 'Growing',
      competitorAnalysis: {
        mainCompetitors: ['Competitor A', 'Competitor B', 'Competitor C'],
        marketShare: Math.floor(Math.random() * 25) + 5 + '%',
        competitiveAdvantage: ['Innovation', 'Customer Service', 'Pricing', 'Technology'][Math.floor(Math.random() * 4)],
      },
      enrichmentSource: 'News Analytics',
    };

    return mockNews;

  } catch (error) {
    console.error('News enrichment error:', error);
    return {};
  }
}

// Industry-specific data
async function enrichIndustryData(industry: string): Promise<any> {
  try {
    const industryInsights: Record<string, any> = {
      'Technology': {
        trends: ['AI/ML adoption', 'Cloud migration', 'Cybersecurity focus'],
        challenges: ['Talent shortage', 'Rapid innovation', 'Competition'],
        opportunities: ['Digital transformation', 'Remote work solutions', 'Data analytics'],
        avgDealSize: '$50,000 - $200,000',
        salesCycle: '3-6 months',
      },
      'Healthcare': {
        trends: ['Telemedicine growth', 'AI diagnostics', 'Patient data security'],
        challenges: ['Regulatory compliance', 'Cost management', 'Staff shortages'],
        opportunities: ['Digital health solutions', 'Preventive care', 'Health analytics'],
        avgDealSize: '$100,000 - $500,000',
        salesCycle: '6-12 months',
      },
      'Finance': {
        trends: ['Fintech disruption', 'Blockchain adoption', 'RegTech solutions'],
        challenges: ['Regulatory changes', 'Cybersecurity threats', 'Customer expectations'],
        opportunities: ['Digital banking', 'Payment innovations', 'Risk management tools'],
        avgDealSize: '$200,000 - $1,000,000',
        salesCycle: '6-18 months',
      }
    };

    const industryData = industryInsights[industry] || {
      trends: ['Market evolution', 'Technology adoption'],
      challenges: ['Competition', 'Cost optimization'],
      opportunities: ['Innovation', 'Market expansion'],
      avgDealSize: '$25,000 - $100,000',
      salesCycle: '2-4 months',
    };

    return {
      industryInsights: {
        ...industryData,
        lastUpdated: new Date(),
        source: 'Industry Analysis',
      }
    };

  } catch (error) {
    console.error('Industry enrichment error:', error);
    return {};
  }
}

// Get enrichment status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const client = await Client.findOne({
      _id: params.id,
      organizationId: userAuth.organizationId,
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check enrichment status
    const enrichmentStatus = {
      isEnriched: !!client.lastEnrichmentDate,
      lastEnrichmentDate: client.lastEnrichmentDate,
      dataCompleteness: calculateDataCompleteness(client),
      availableEnrichments: getAvailableEnrichments(client),
    };

    return NextResponse.json({
      success: true,
      data: enrichmentStatus,
    });

  } catch (error) {
    console.error('Get enrichment status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get enrichment status' },
      { status: 500 }
    );
  }
}

function calculateDataCompleteness(client: any): number {
  const fields = [
    'name', 'email', 'company', 'phone', 'jobTitle', 'industry',
    'companySize', 'annualRevenue', 'website', 'address.city'
  ];
  
  let completedFields = 0;
  
  fields.forEach(field => {
    const value = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], client)
      : client[field];
    
    if (value && value.toString().trim()) {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
}

function getAvailableEnrichments(client: any): string[] {
  const enrichments = [];
  
  if (!client.companySize) enrichments.push('Company Size');
  if (!client.annualRevenue) enrichments.push('Annual Revenue');
  if (!client.industry) enrichments.push('Industry');
  if (!client.socialMedia?.linkedin) enrichments.push('LinkedIn Profile');
  if (!client.recentNews) enrichments.push('Recent News');
  if (!client.competitorAnalysis) enrichments.push('Competitor Analysis');
  if (!client.industryInsights) enrichments.push('Industry Insights');
  
  return enrichments;
}