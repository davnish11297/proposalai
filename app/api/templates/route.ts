import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import Client from '@/models/Client';

export async function GET(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const clientId = searchParams.get('clientId');
    const getRecommendations = searchParams.get('recommendations') === 'true';

    await connectDB();

    let query: any = {
      $or: [
        { organizationId: userAuth.organizationId },
        { isSystemTemplate: true, isPublic: true }
      ],
      status: 'PUBLISHED'
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (industry && industry !== 'all') {
      query.industry = industry;
    }

    // Get templates
    let templates = await Template.find(query)
      .populate('userId', 'firstName lastName')
      .sort({ isSystemTemplate: -1, 'rating.average': -1, usageCount: -1 });

    // Get smart recommendations if clientId provided
    let recommendations = [];
    if (getRecommendations && clientId) {
      recommendations = await generateSmartRecommendations(clientId, userAuth.organizationId);
    }

    // Add success analytics to each template
    const templatesWithAnalytics = await Promise.all(
      templates.map(async (template) => {
        const analytics = await getTemplateAnalytics(template._id);
        return {
          ...template.toJSON(),
          analytics
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        templates: templatesWithAnalytics,
        recommendations,
        total: templates.length
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      content,
      category,
      industry,
      tags,
      sections,
      variables,
      isPublic
    } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: 'Name and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const template = await Template.create({
      name,
      description,
      content,
      category: category || 'BUSINESS_PROPOSAL',
      industry,
      tags: tags || [],
      sections: sections || [],
      variables: variables || [],
      isPublic: isPublic || false,
      organizationId: userAuth.organizationId,
      userId: userAuth.userId,
      status: 'PUBLISHED',
      publishedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

async function generateSmartRecommendations(clientId: string, organizationId: string) {
  try {
    // Get client information
    const client = await Client.findOne({
      _id: clientId,
      organizationId
    });

    if (!client) {
      return [];
    }

    const recommendations = [];

    // Industry-based recommendations
    if (client.industry) {
      const industryTemplates = await Template.find({
        $or: [
          { organizationId },
          { isSystemTemplate: true, isPublic: true }
        ],
        industry: client.industry,
        status: 'PUBLISHED'
      })
        .sort({ 'rating.average': -1 })
        .limit(3);

      if (industryTemplates.length > 0) {
        recommendations.push({
          type: 'industry',
          title: `${client.industry} Templates`,
          description: `Templates optimized for ${client.industry} industry`,
          templates: industryTemplates,
          confidence: 0.9
        });
      }
    }

    // Company size based recommendations
    if (client.companySize) {
      const sizeBasedCategory = getSizeBasedCategory(client.companySize);
      if (sizeBasedCategory) {
        const sizeTemplates = await Template.find({
          $or: [
            { organizationId },
            { isSystemTemplate: true, isPublic: true }
          ],
          category: sizeBasedCategory,
          status: 'PUBLISHED'
        })
          .sort({ 'rating.average': -1 })
          .limit(2);

        if (sizeTemplates.length > 0) {
          recommendations.push({
            type: 'company-size',
            title: 'Right-sized Templates',
            description: `Templates suitable for ${client.companySize} companies`,
            templates: sizeTemplates,
            confidence: 0.7
          });
        }
      }
    }

    // High-performance templates
    const topTemplates = await Template.find({
      $or: [
        { organizationId },
        { isSystemTemplate: true, isPublic: true }
      ],
      status: 'PUBLISHED',
      'rating.average': { $gte: 4.0 },
      usageCount: { $gte: 10 }
    })
      .sort({ 'rating.average': -1, usageCount: -1 })
      .limit(3);

    if (topTemplates.length > 0) {
      recommendations.push({
        type: 'high-performance',
        title: 'High-Performance Templates',
        description: 'Templates with proven success rates',
        templates: topTemplates,
        confidence: 0.8
      });
    }

    return recommendations;

  } catch (error) {
    console.error('Error generating smart recommendations:', error);
    return [];
  }
}

function getSizeBasedCategory(companySize: string): string | null {
  const sizeMap: Record<string, string> = {
    '1-10': 'SALES_PROPOSAL',
    '11-50': 'BUSINESS_PROPOSAL', 
    '51-200': 'PROJECT_PROPOSAL',
    '201-500': 'RFP_RESPONSE',
    '501-1000': 'RFP_RESPONSE',
    '1000+': 'RFP_RESPONSE'
  };

  return sizeMap[companySize] || null;
}

async function getTemplateAnalytics(templateId: string) {
  try {
    // This would typically query proposal usage data
    // For now, return mock analytics
    return {
      usageCount: Math.floor(Math.random() * 100) + 10,
      successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      avgResponseTime: Math.floor(Math.random() * 5) + 1 + ' days',
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Within last 30 days
    };
  } catch (error) {
    console.error('Error getting template analytics:', error);
    return {
      usageCount: 0,
      successRate: 0,
      avgResponseTime: 'N/A',
      lastUsed: null
    };
  }
}