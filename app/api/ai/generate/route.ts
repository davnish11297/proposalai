import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Messages array is required'
        },
        { status: 400 }
      );
    }

    // Check if OpenRouter API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service not configured. Please check environment variables.'
        },
        { status: 500 }
      );
    }

    console.log('Using OpenRouter API key:', apiKey.substring(0, 10) + '...');

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'ProposalAI'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    console.log('OpenRouter response status:', openRouterResponse.status);

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorData);
      
      if (openRouterResponse.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid API key. Please check your OpenRouter API key configuration.'
          },
          { status: 401 }
        );
      }
      
      if (openRouterResponse.status === 402) {
        return NextResponse.json(
          {
            success: false,
            error: 'OpenRouter credits exhausted. Please visit OpenRouter to add more credits.'
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI service is currently unavailable'
        },
        { status: 503 }
      );
    }

    const data = await openRouterResponse.json();
    console.log('OpenRouter response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response from AI service'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: data.choices[0].message.content,
      usage: data.usage
    });

  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI content'
      },
      { status: 500 }
    );
  }
}