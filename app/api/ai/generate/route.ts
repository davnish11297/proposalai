import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import { validateContent, getErrorMessage, addContentFilteringInstructions } from '@/lib/utils/contentValidation';

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

    // Pre-generation validation: Check user input for inappropriate content
    const userMessages = messages.filter(msg => msg.role === 'user');
    for (const message of userMessages) {
      const validation = validateContent(message.content);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: getErrorMessage(validation.error!),
            validationError: true
          },
          { status: 400 }
        );
      }
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

    // Add content filtering instructions to system messages
    const enhancedMessages = messages.map(message => {
      if (message.role === 'system') {
        return {
          ...message,
          content: addContentFilteringInstructions(message.content)
        };
      }
      return message;
    });

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
        messages: enhancedMessages,
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

    // Post-generation validation: Check AI response for inappropriate content
    const aiResponse = data.choices[0].message.content;
    const validation = validateContent(aiResponse);
    
    if (!validation.isValid) {
      console.log('AI response validation failed:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: 'The generated content contains inappropriate material. Please try rephrasing your request with clearer, more professional language.',
          validationError: true
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      content: validation.sanitizedContent || aiResponse,
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