import { Env } from '../types';
import { getAllModels } from '../models';
import { createOpenAIResponse } from '../utils/response';
import { Logger } from '../utils/logger';
// Removed D1StorageService import - using static model configuration

// OpenAI 模型对象接口
interface OpenAIModel {
  id: string;
  object: 'model';
  created: number;
  provider: string;
  supportedFeatures: string[];
}

// 模型列表响应接口
interface OpenAIModelsResponse {
  object: 'list';
  data: OpenAIModel[];
}

// 获取模型列表处理器
export async function handleModels(
  request: Request,
  env: Env,
  logger: Logger
): Promise<Response> {
  try {
    logger.info('Fetching available models list');
    
    // API请求，返回OpenAI兼容格式
    const supportedModels = getAllModels(true);

    const models: OpenAIModel[] = supportedModels.map(modelConfig => ({
      id: modelConfig.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      provider: modelConfig.provider,
      supportedFeatures: modelConfig.supportedFeatures
    }));

      const response: OpenAIModelsResponse = {
        object: 'list',
        data: models
      };

      logger.info(`Returning ${models.length} available models`);
      
      return createOpenAIResponse(response);

  } catch (error) {
    logger.error('Error fetching models list', { error: String(error) });
    
    return createOpenAIResponse({
      object: 'list',
      data: []
    });
  }
}