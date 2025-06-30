import { 
  Env, 
  ImageGenerationRequest, 
  ImageGenerationResponse,
  ImageData,
  AIModel
} from '../types';
import { getModelConfig } from '../models';
import { createOpenAIResponse, createErrorResponse, generateId } from '../utils/response';
import { Logger } from '../utils/logger';
import { AIGatewayClient } from '../utils/ai-gateway';
// Removed D1StorageService import - using static model configuration

// 图像生成处理器
export async function handleImageGeneration(
  request: Request,
  env: Env,
  logger: Logger
): Promise<Response> {
  try {
    // 解析请求体
    const body: ImageGenerationRequest = await request.json();
    
    // 验证必需字段
    if (!body.model || !body.prompt) {
      logger.error('Invalid request: missing model or prompt');
      return createErrorResponse('Missing required fields: model and prompt');
    }

    // 获取模型配置
    const modelConfig = getModelConfig(body.model);
     if (!modelConfig) {
       logger.warn(`Unsupported model requested: ${body.model}`);
       return createErrorResponse(`Model ${body.model} is not supported. Available models can be found at /v1/models`);
    }

    // 检查模型是否支持图像生成
    if (!modelConfig.supportedFeatures.includes('image-generation')) {
      logger.warn(`Model ${body.model} does not support image generation`);
      return createErrorResponse(`Model ${body.model} does not support image generation`);
    }

    logger.info(`Using image generation model ${body.model}`);

    // 创建 AI Gateway 客户端
    const aiGateway = new AIGatewayClient(env, logger);
    
    // 验证 AI Gateway 配置
    const configValidation = aiGateway.validateConfig();
    if (!configValidation.valid) {
      logger.error('AI Gateway configuration invalid', { errors: configValidation.errors });
      return createErrorResponse(`AI Gateway configuration error: ${configValidation.errors.join(', ')}`);
    }

    // 构建图像生成请求
    const gatewayRequest = {
      model: modelConfig.endpoint,
      prompt: body.prompt,
      width: body.width || 1024,
      height: body.height || 1024,
      steps: body.steps || 4
    };

    // 通过 AI Gateway 调用图像生成模型
    const response = await aiGateway.callImageGeneration(modelConfig, gatewayRequest);

    // 构建 OpenAI 兼容的响应
    const imageResponse: ImageGenerationResponse = {
      id: generateId('img'),
      object: 'image.generation',
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      data: response.data || [],
      usage: response.usage
    };

    logger.info('Image generation successful');

    return createOpenAIResponse(imageResponse);

  } catch (error) {
    logger.error('Error in image generation', { error: String(error) });
    
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    return createErrorResponse(
      'Internal server error occurred while processing image generation',
      500,
      'internal_error'
    );
  }
}