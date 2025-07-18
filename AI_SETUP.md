# AI Provider Setup Guide

ProposalAI now supports multiple AI providers, including free options. Here's how to set them up:

## Free AI Options

### 1. Template-Based Generation (Recommended for Free Use)
**Cost**: Free  
**Setup**: No configuration needed  
**Features**: Generates professional proposals using predefined templates

This option works immediately without any API keys or setup. It creates structured proposals based on your input data.

### 2. Hugging Face Inference API
**Cost**: Free tier available  
**Setup**: 
1. Sign up at [Hugging Face](https://huggingface.co/)
2. Get your API key from [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Add to your `.env` file:
   ```
   HUGGINGFACE_API_KEY="your-api-key-here"
   ```

**Features**: Access to thousands of open-source AI models

### 3. Ollama (Local Models)
**Cost**: Free  
**Setup**:
1. Install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Download a model: `ollama pull llama2`
3. Start Ollama service
4. No API key needed

**Features**: Run AI models locally on your machine

## Paid Options

### OpenAI
**Cost**: Pay-per-use  
**Setup**:
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to your `.env` file:
   ```
   OPENAI_API_KEY="your-openai-api-key-here"
   ```

## How It Works

The system automatically tries providers in this order:
1. Your preferred provider (set based on available API keys)
2. Hugging Face
3. Template-based generation (fallback)

If one provider fails (quota exceeded, API down, etc.), it automatically tries the next one.

## Environment Configuration

Create a `.env` file in your project root with your chosen configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/proposalai"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001

# AI Provider (choose one or more)
OPENAI_API_KEY="your-openai-key"           # Optional
HUGGINGFACE_API_KEY="your-hf-key"          # Optional

# Other settings
UPLOAD_DIR="./uploads"
FRONTEND_URL="http://localhost:3000"
```

## Testing AI Generation

1. Start your backend server
2. Create a proposal in the frontend
3. Use the "Generate with AI" feature
4. Check the console logs to see which provider was used

## Troubleshooting

### "No AI providers available"
- Make sure you have at least one API key configured
- Template generation should always work as a fallback

### "API quota exceeded"
- The system will automatically try the next available provider
- Consider adding multiple API keys for redundancy

### "Ollama connection failed"
- Make sure Ollama is installed and running
- Check if the model is downloaded: `ollama list`

## Performance Notes

- **Template-based**: Fastest, always available
- **Hugging Face**: Good performance, free tier limits
- **Ollama**: Depends on your hardware, completely local
- **OpenAI**: Best quality, but costs money

## Recommended Setup for Free Use

1. Start with template-based generation (works immediately)
2. Add Hugging Face API key for better AI generation
3. Consider Ollama for local processing if you have good hardware 