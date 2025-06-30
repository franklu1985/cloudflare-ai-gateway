import {
  Env, 
  OpenAIChatCompletionRequest, 
  OpenAIChatCompletionResponse,
  OpenAIMessage,
  OpenAIChatCompletionChoice,
  OpenAIUsage,
  OpenAIStreamChunk,
  AIModel
} from '../types';
import { getModelConfig } from '../models';
import { createOpenAIResponse, createErrorResponse, generateId, createStreamResponse } from '../utils/response';
import { Logger } from '../utils/logger';
import { AIGatewayClient } from '../utils/ai-gateway';
// Removed DirectAPIClient import - simplified to use AI Gateway only
// Removed D1StorageService import - using static model configuration
// import { getApiKeyFromRequest } from '../services/auth'; // TODO: 重新启用当使用统计功能实现时

// 聊天完成处理器
export async function handleChatCompletion(
  request: Request,
  env: Env,
  logger: Logger
): Promise<Response> {
  const startTime = Date.now();
  try {
    const body: OpenAIChatCompletionRequest = await request.json();
    
    if (!body.model || !body.messages) {
      return createErrorResponse('Missing required fields: model and messages');
    }

    const modelConfig = getModelConfig(body.model);
     if (!modelConfig) {
       return createErrorResponse(`Model ${body.model} is not supported.`);
    }

    // 使用AI Gateway调用所有模型
    const aiGateway = new AIGatewayClient(env, logger);
    
    // 验证AI Gateway配置
    const configValidation = aiGateway.validateConfig();
    if (!configValidation.valid) {
      logger.error('AI Gateway configuration invalid', { errors: configValidation.errors });
      return createErrorResponse(`AI Gateway configuration error: ${configValidation.errors.join(', ')}`);
    }

    const gatewayRequest = {
      model: modelConfig.endpoint,
      messages: body.messages,
      stream: body.stream || false,
      max_tokens: body.max_tokens || 4096,
      temperature: body.temperature,
      top_p: body.top_p
    };

    const response = await aiGateway.callModel(modelConfig, gatewayRequest);

    const latency = Date.now() - startTime;

    // TODO: 获取 API Key 和用户信息用于统计 - 当使用统计功能完整实现时启用
    // const apiKey = await getApiKeyFromRequest(request, env);

    if (!response.ok) {
        const errorText = await response.text();
        return createErrorResponse(`Failed to call model: ${errorText}`, response.status);
    }

    // 处理流式响应
    if (body.stream) {
      // 对于流式响应，需要处理不同API格式的SSE数据
      const responseContentType = response.headers.get('content-type');
      
      if (!responseContentType?.includes('text/event-stream') && !responseContentType?.includes('text/plain')) {
        // 某些API可能返回非标准的content-type，尝试处理
        logger.warn('Unexpected content type for streaming response', { contentType: responseContentType });
      }

      // 创建转换流，将各种格式的SSE数据统一为OpenAI格式
      const stream = new ReadableStream({
        start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (!reader) {
            controller.error(new Error('Response body is not readable'));
            return;
          }

                     function pump(): Promise<void> {
             return reader!.read().then(({ done, value }) => {
              if (done) {
                // 发送结束标记
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      continue;
                    }

                    let chunk: any;
                    try {
                      chunk = JSON.parse(data);
                    } catch {
                      // 如果解析失败，跳过这行
                      continue;
                    }

                    // 转换为OpenAI格式
                    const openaiChunk = transformStreamChunkToOpenAI(chunk, body.model, modelConfig.provider);
                    if (openaiChunk) {
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                    }
                  } catch (error) {
                    logger.error('Error processing stream chunk', { error: String(error), line });
                  }
                }
              }

              return pump();
            });
          }

          pump().catch(error => {
            logger.error('Stream processing error', { error: String(error) });
            controller.error(error);
          });
        }
      });
      
      return createStreamResponse(stream);
    } else {
      const jsonResponse = await response.json();
      const openAIResponse = transformToOpenAIResponse(jsonResponse, body.model, modelConfig.provider);

      // TODO: 记录使用情况 - 需要实现使用统计功能
      // if (apiKey && openAIResponse.usage) {
      //   await storageService.logModelUsage({
      //     modelId: modelConfig.id,
      //     userId: apiKey.userId,
      //     apiKeyId: apiKey.id,
      //     promptTokens: openAIResponse.usage.prompt_tokens,
      //     completionTokens: openAIResponse.usage.completion_tokens,
      //     totalTokens: openAIResponse.usage.total_tokens,
      //     latency: latency,
      //   });
      // }

      return createOpenAIResponse(openAIResponse);
    }

  } catch (error) {
    logger.error('Error in chat completion', { error: String(error) });
    return createErrorResponse('Internal server error', 500);
  }
}

// 将任意响应转换为OpenAI格式
function transformToOpenAIResponse(
  apiResponse: any,
  modelId: string,
  provider: string
): OpenAIChatCompletionResponse {
  let assistantContent = '';
  let finishReason = 'stop';
  let usage: OpenAIUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  
  switch (provider) {
    case 'google':
      assistantContent = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      finishReason = apiResponse.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'unknown';
      // Google API for non-streaming doesn't consistently provide token usage
      if (apiResponse.usageMetadata) {
        usage = {
          prompt_tokens: apiResponse.usageMetadata.promptTokenCount || 0,
          completion_tokens: apiResponse.usageMetadata.candidatesTokenCount || 0,
          total_tokens: apiResponse.usageMetadata.totalTokenCount || 0,
        };
      }
      break;

    case 'openrouter':
    case 'deepseek':
    case 'doubao':
      // 这些提供商已经是OpenAI兼容格式
      assistantContent = apiResponse.choices?.[0]?.message?.content || '';
      finishReason = apiResponse.choices?.[0]?.finish_reason || 'stop';
      if (apiResponse.usage) {
        usage = apiResponse.usage;
      }
      break;
    
    case 'workers-ai':
      if (typeof apiResponse === 'string') {
        assistantContent = apiResponse;
      } else if (apiResponse.result?.response) {
        assistantContent = apiResponse.result.response;
      } else if (typeof apiResponse.response === 'string') {
        assistantContent = apiResponse.response;
      } else {
        assistantContent = '';
      }

      if (apiResponse.result?.usage) {
        usage = apiResponse.result.usage;
      }
      break;

    case 'qwen':
    case 'anthropic':
      // 这些提供商通过AI Gateway转换为OpenAI格式
      assistantContent = apiResponse.choices?.[0]?.message?.content || '';
      finishReason = apiResponse.choices?.[0]?.finish_reason || 'stop';
      if (apiResponse.usage) {
        usage = apiResponse.usage;
      }
      break;

    case 'cohere':
      assistantContent = apiResponse.text || '';
      finishReason = apiResponse.finish_reason === 'COMPLETE' ? 'stop' : apiResponse.finish_reason;
      if (apiResponse.meta?.tokens) {
        usage = {
          prompt_tokens: apiResponse.meta.tokens.input_tokens || 0,
          completion_tokens: apiResponse.meta.tokens.output_tokens || 0,
          total_tokens: (apiResponse.meta.tokens.input_tokens || 0) + (apiResponse.meta.tokens.output_tokens || 0),
        };
      }
      break;

    default:
      assistantContent = JSON.stringify(apiResponse);
      if (apiResponse.usage) {
        usage = apiResponse.usage;
      }
      break;
  }

  return {
    id: generateId('chatcmpl'),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: assistantContent },
      finish_reason: finishReason
    } as OpenAIChatCompletionChoice],
    usage
  };
}

// 将流式响应块转换为OpenAI格式
function transformStreamChunkToOpenAI(
  chunk: any,
  modelId: string,
  provider: string
): OpenAIStreamChunk | null {
  let content = '';
  let finishReason: 'stop' | 'length' | 'content_filter' | null = null;

  switch (provider) {
    case 'openrouter':
    case 'deepseek':
    case 'doubao':
      // 这些提供商通常已经是OpenAI兼容格式
      content = chunk.choices?.[0]?.delta?.content || '';
      finishReason = chunk.choices?.[0]?.finish_reason || null;
      break;

    case 'workers-ai':
      content = chunk.response || '';
      finishReason = chunk.finish_reason === 'stop' ? 'stop' : null;
      break;

    case 'google':
      content = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
      finishReason = chunk.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : null;
      break;

    case 'qwen':
      content = chunk.output?.text || '';
      finishReason = chunk.output?.finish_reason === 'stop' ? 'stop' : null;
      break;

    case 'anthropic':
      if (chunk.type === 'content_block_delta') {
        content = chunk.delta?.text || '';
      } else if (chunk.type === 'message_stop') {
        finishReason = 'stop';
      }
      break;

    case 'cohere':
      content = chunk.text || '';
      finishReason = chunk.finish_reason === 'COMPLETE' ? 'stop' : null;
      break;

    default:
      return null;
  }

  // 如果没有内容且没有结束原因，跳过这个块
  if (!content && !finishReason) {
    return null;
  }

  return {
    id: generateId('chatcmpl'),
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{
      index: 0,
      delta: content ? { content } : {},
      finish_reason: finishReason
    }]
  };
}