#!/usr/bin/env node

/**
 * Galatea AI Gateway 开发环境测试脚本
 * 根据返回的模型列表对每一个模型进行逐一测试
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载 .dev.vars 文件中的环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.dev.vars') });

// 检查必需的环境变量
function checkRequiredEnvVars() {
    const requiredVars = ['USER_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('\n❌ 缺少必需的环境变量:');
        missingVars.forEach(varName => {
            console.log(`   ${varName}`);
        });
        console.log('\n💡 请确保以下环境变量已设置:');
        console.log('   • 复制 .dev.vars.example 为 .dev.vars');
        console.log('   • 在 .dev.vars 中填入您的实际配置');
        console.log('   • 确保 USER_API_KEY 设置为有效的API密钥');
        process.exit(1);
    }
}

// 在启动时检查环境变量
checkRequiredEnvVars();

// 配置
const CONFIG = {
    baseUrl: 'http://127.0.0.1:8787',
    timeout: 30000,
    delayBetweenTests: 1000, // 测试间隔时间（毫秒）
    maxTokens: 256,
    testMessage: "Hello! Who are you?",
    // API密钥配置 - 从环境变量读取，确保安全
    apiKey: process.env.USER_API_KEY,
    // 图像生成配置
    imageGeneration: {
        prompt: "a beautiful girl with long hair, wearing a red dress, standing in a garden",
        steps: 4,
        width: 576,
        height: 1024,
        seed: 98
    },
    // 输出目录
    outputDir: './test-output'
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${message}`, 'cyan');
    log('='.repeat(message.length), 'cyan');
}

function logStep(message) {
    log(`\n${message}`, 'green');
}

function logTest(message) {
    log(`  ${message}`, 'yellow');
}

function logSuccess(message) {
    log(`  ✅ ${message}`, 'green');
}

function logError(message) {
    log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`  ⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
    log(`  📄 ${message}`, 'blue');
}

// HTTP请求函数
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`,
                ...options.headers
            },
            timeout: CONFIG.timeout
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : null;
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        rawData: data
                    });
                } catch (error) {
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: null,
                        rawData: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                success: false,
                error: error.message,
                statusCode: null
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject({
                success: false,
                error: 'Request timeout',
                statusCode: null
            });
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取模型提供商
function getModelProvider(modelId) {
    if (modelId.startsWith('llama-') || modelId.startsWith('mistral-')) {
        return 'Workers AI';
    } else if (modelId.startsWith('openai/') || modelId.startsWith('anthropic/') || 
               modelId.startsWith('meta-llama/') || modelId.startsWith('mistralai/')) {
        return 'OpenRouter';
    } else if (modelId.startsWith('gemini-')) {
        return 'Google';
    }
    return 'Unknown';
}

// 判断模型类型
function getModelType(modelId) {
    const imageGenerationModels = [
        'flux-1-schnell',
        'stable-diffusion-v1-5-inpainting',
        'stable-diffusion-xl-lightning'
    ];
    
    if (imageGenerationModels.includes(modelId)) {
        return 'image-generation';
    }
    return 'chat';
}

// 检查开发服务器状态
async function checkServerStatus() {
    logStep('🔍 第零步: 检查开发服务器状态');
    
    try {
        const response = await makeRequest(CONFIG.baseUrl);
        if (response.success && response.statusCode === 200) {
            logSuccess('开发服务器连通性正常');
            return true;
        } else {
            logError(`开发服务器响应异常: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError(`开发服务器连接失败: ${error.error}`);
        log('\n💡 启动开发服务器的方法:', 'yellow');
        log('   npm run dev', 'cyan');
        log('   或者', 'gray');
        log('   npm run dev:local', 'cyan');
        log('\n🔧 开发环境特性:', 'cyan');
        log('   • 无需KV存储依赖', 'white');
        log('   • 支持热重载', 'white');
        log('   • 详细调试日志', 'white');
        log('   • 本地快速迭代', 'white');
        return false;
    }
}

// 健康检查
async function healthCheck() {
    logStep('🩺 第一步: 健康检查');
    
    try {
        const response = await makeRequest(`${CONFIG.baseUrl}/`);
        if (response.success && response.statusCode === 200) {
            logSuccess('健康检查通过');
            if (response.data) {
                logInfo(`服务状态: ${response.data.data?.status || 'unknown'}`);
                logInfo(`环境: ${response.data.data?.environment || 'unknown'}`);
            }
            return true;
        } else {
            logError(`健康检查失败: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError(`健康检查错误: ${error.error}`);
        return false;
    }
}

// 获取模型列表
async function getModels() {
    logStep('📋 第二步: 获取可用模型列表');
    
    try {
        const response = await makeRequest(`${CONFIG.baseUrl}/v1/models`);
        if (response.success && response.statusCode === 200) {
            logSuccess('模型列表获取成功');
            
            const allModels = response.data?.data || [];
            logInfo(`检测到 ${allModels.length} 个可用模型`);
            
            // 按类型和提供商分组
            const modelsByType = {
                chat: [],
                'image-generation': []
            };
            
            allModels.forEach(model => {
                const modelType = getModelType(model.id);
                const provider = model.provider || getModelProvider(model.id);
                const features = model.supportedFeatures || [];
                
                modelsByType[modelType].push({
                    id: model.id,
                    provider: provider,
                    features: features
                });
            });
            
            logInfo('模型按类型分组:');
            log(`      • 聊天模型 (${modelsByType.chat.length}个):`, 'white');
            modelsByType.chat.forEach(model => {
                log(`        - ${model.id} [${model.provider}] (${model.features.join(', ')})`, 'gray');
            });
            
            log(`      • 图像生成模型 (${modelsByType['image-generation'].length}个):`, 'white');
            modelsByType['image-generation'].forEach(model => {
                log(`        - ${model.id} [${model.provider}] (${model.features.join(', ')})`, 'gray');
            });
            
            return allModels.map(model => model.id);
        } else {
            logError(`模型列表获取失败: ${response.statusCode}`);
            return [];
        }
    } catch (error) {
        logError(`模型列表获取错误: ${error.error}`);
        return [];
    }
}

// 检查环境配置
function checkEnvironmentConfig() {
    logStep('🔧 第三步: 检查开发环境配置');
    
    const devVarsPath = '.dev.vars';
    if (fs.existsSync(devVarsPath)) {
        logSuccess('.dev.vars 文件存在');
        
        const content = fs.readFileSync(devVarsPath, 'utf8');
        const lines = content.split('\n').filter(line => 
            line.trim() && !line.startsWith('#') && line.includes('=')
        );
        
        const requiredSecrets = ['WORKERS_AI_API_KEY'];
        const optionalSecrets = ['OPENROUTER_API_KEY', 'GOOGLE_API_KEY'];
        
        logInfo('必需的配置:');
        requiredSecrets.forEach(secret => {
            const found = lines.some(line => line.startsWith(`${secret}=`));
            if (found) {
                logSuccess(`${secret} (已配置)`);
            } else {
                logError(`${secret} (未配置)`);
            }
        });
        
        logInfo('可选的配置:');
        optionalSecrets.forEach(secret => {
            const found = lines.some(line => line.startsWith(`${secret}=`));
            if (found) {
                logSuccess(`${secret} (已配置)`);
            } else {
                logWarning(`${secret} (未配置)`);
            }
        });
        
        return true;
    } else {
        logError('.dev.vars 文件不存在');
        log('💡 请复制 .dev.vars.example 并配置API密钥', 'yellow');
        return false;
    }
}

// 测试单个模型
async function testModel(modelId, modelInfo = null) {
    const provider = modelInfo?.provider || getModelProvider(modelId);
    const displayName = modelId.includes('/') ? modelId.split('/')[1] : modelId;
    
    logTest(`🧠 测试模型: ${displayName} [${provider}]`);
    
    const requestBody = {
        model: modelId,
        messages: [
            {
                role: "user",
                content: CONFIG.testMessage
            }
        ],
        max_tokens: CONFIG.maxTokens,
        temperature: 0.7
    };
    
    try {
        const response = await makeRequest(`${CONFIG.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            body: requestBody
        });
        
        if (response.success && response.statusCode === 200) {
            logSuccess(`${displayName} 聊天测试通过`);
            
            if (response.data?.choices?.[0]?.message?.content) {
                const content = response.data.choices[0].message.content;
                const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
                logInfo(`AI回复: ${preview}`);
            }
            
            if (response.data?.usage) {
                logInfo(`Token使用: ${response.data.usage.total_tokens} tokens`);
            }
            
            return {
                success: true,
                modelId,
                provider,
                statusCode: response.statusCode
            };
        } else {
            logError(`${displayName} 聊天测试失败: ${response.statusCode}`);
            if (response.rawData) {
                logInfo(`错误详情: ${response.rawData}`);
            }
            return {
                success: false,
                modelId,
                provider,
                statusCode: response.statusCode,
                error: response.rawData
            };
        }
    } catch (error) {
        logError(`${displayName} 聊天测试错误: ${error.error}`);
        return {
            success: false,
            modelId,
            provider,
            error: error.error
        };
    }
}

// 测试图像生成模型
async function testImageGenerationModel(modelId, modelInfo = null) {
    const provider = modelInfo?.provider || getModelProvider(modelId);
    const displayName = modelId.includes('/') ? modelId.split('/')[1] : modelId;
    
    logTest(`🎨 测试图像生成模型: ${displayName} [${provider}]`);
    
    const requestBody = {
        model: modelId,
        prompt: CONFIG.imageGeneration.prompt,
        width: CONFIG.imageGeneration.width,
        height: CONFIG.imageGeneration.height,
        steps: CONFIG.imageGeneration.steps
    };
    
    try {
        const response = await makeRequest(`${CONFIG.baseUrl}/v1/images/generations`, {
            method: 'POST',
            body: requestBody
        });
        
        if (response.success && response.statusCode === 200) {
            logSuccess(`${displayName} 图像生成测试通过`);
            
            if (response.data?.data && response.data.data.length > 0) {
                const imageData = response.data.data[0];
                
                if (imageData.b64_json) {
                    logInfo(`图像数据长度: ${imageData.b64_json.length} 字符`);
                    
                    // 保存图片文件
                    const fileName = `${modelId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
                    const filePath = path.join(CONFIG.outputDir, fileName);
                    
                    try {
                        const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
                        fs.writeFileSync(filePath, imageBuffer);
                        logSuccess(`图片已保存: ${fileName}`);
                        logInfo(`文件路径: ${filePath}`);
                    } catch (saveError) {
                        logError(`保存图片失败: ${saveError.message}`);
                    }
                } else {
                    logWarning('响应中没有Base64图像数据');
                }
            } else {
                logWarning('响应中没有图像数据');
            }
            
            if (response.data?.usage) {
                logInfo(`使用情况: ${JSON.stringify(response.data.usage)}`);
            }
            
            return {
                success: true,
                modelId,
                provider,
                statusCode: response.statusCode
            };
        } else {
            logError(`${displayName} 图像生成测试失败: ${response.statusCode}`);
            if (response.rawData) {
                logInfo(`错误详情: ${response.rawData}`);
            }
            return {
                success: false,
                modelId,
                provider,
                statusCode: response.statusCode,
                error: response.rawData
            };
        }
    } catch (error) {
        logError(`${displayName} 图像生成测试错误: ${error.error}`);
        return {
            success: false,
            modelId,
            provider,
            error: error.error
        };
    }
}

// 测试流式聊天模型
async function testStreamingChatModel(modelId, modelInfo = null) {
    const provider = modelInfo?.provider || getModelProvider(modelId);
    const displayName = modelId.includes('/') ? modelId.split('/')[1] : modelId;
    
    logTest(`🌊 测试流式聊天模型: ${displayName} [${provider}]`);
    
    const requestBody = {
        model: modelId,
        messages: [{ role: "user", content: "Tell me a short story about a robot who dreams of being a bird." }],
        stream: true,
        max_tokens: 150
    };
    
    try {
        const response = await fetch(`${CONFIG.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`
            }
        });
        
        if (response.ok && response.body) {
            logSuccess(`${displayName} 流式聊天测试连接成功，开始接收数据...`);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialLine = "";
            let fullResponse = "";

            process.stdout.write('  AI回复: ');

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    process.stdout.write('\n'); // 结束时换行
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                partialLine += chunk;
                const lines = partialLine.split('\n');
                partialLine = lines.pop() || "";
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6).trim();
                        if (data === '[DONE]') {
                            continue; // We will handle the end of stream outside the loop
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                process.stdout.write(content);
                                fullResponse += content;
                            }
                        } catch(e) {
                            logWarning(`\n无法解析的流数据块: ${data}`);
                        }
                    }
                }
            }

            if (fullResponse.length > 0) {
                 logSuccess(`流式响应接收完毕 (总长度: ${fullResponse.length})`);
            } else {
                logError('未收到有效的流式响应内容');
            }
            
            return { success: true, modelId, provider, statusCode: response.status };
        } else {
            logError(`${displayName} 流式聊天测试失败: ${response.status}`);
            const errorText = await response.text();
            logInfo(`错误详情: ${errorText}`);
            return { success: false, modelId, provider, statusCode: response.status, error: errorText };
        }
    } catch (error) {
        logError(`${displayName} 流式聊天测试错误: ${error.error}`);
        return { success: false, modelId, provider, error: error.error };
    }
}

// 测试所有模型
async function testAllModels(availableModels) {
    logStep('🤖 第四步: 模型功能测试');
    
    const results = [];
    const totalModels = availableModels.length;
    
    logInfo(`开始测试 ${totalModels} 个模型...`);
    
    let modelDetails = [];
    try {
        const response = await makeRequest(`${CONFIG.baseUrl}/v1/models`);
        if (response.success && response.statusCode === 200) {
            modelDetails = response.data?.data || [];
        }
    } catch (error) {
        logWarning('无法获取模型详细信息，将使用本地判断');
    }
    
    for (let i = 0; i < availableModels.length; i++) {
        const modelId = availableModels[i];
        const modelInfo = modelDetails.find(m => m.id === modelId);
        const modelType = getModelType(modelId);
        
        log(`\n   [${i + 1}/${totalModels}] 测试${modelType === 'image-generation' ? '图像生成' : '聊天'}模型: ${modelId}`, 'cyan');
        
        let result;
        if (modelType === 'image-generation') {
            result = await testImageGenerationModel(modelId, modelInfo);
        } else {
            result = await testModel(modelId, modelInfo);
            // 如果模型支持流式传输，则额外进行流式测试
            if (modelInfo && modelInfo.supportedFeatures.includes('streaming')) {
                const streamResult = await testStreamingChatModel(modelId, modelInfo);
                // 将流式测试结果合并到报告中
                results.push({ ...streamResult, modelId: `${modelId} (stream)` });
            }
        }
        
        results.push(result);
        
        if (i < availableModels.length - 1) {
            await delay(CONFIG.delayBetweenTests);
        }
    }
    
    return results;
}

// 生成测试报告
function generateReport(healthResult, modelsResult, configResult, modelTestResults) {
    logHeader('📊 开发环境测试总结');
    
    const totalTests = 2 + modelTestResults.length; // 健康检查 + 模型列表 + 模型测试
    const successfulTests = (healthResult ? 1 : 0) + (modelsResult.length > 0 ? 1 : 0) + 
                           modelTestResults.filter(r => r.success).length;
    
    // 基础测试结果
    log(`健康检查: ${healthResult ? '✅ 通过' : '❌ 失败'}`, healthResult ? 'green' : 'red');
    log(`模型列表: ${modelsResult.length > 0 ? '✅ 通过' : '❌ 失败'}`, modelsResult.length > 0 ? 'green' : 'red');
    
    // 按模型类型统计
    const chatModels = modelTestResults.filter(r => getModelType(r.modelId) === 'chat');
    const imageModels = modelTestResults.filter(r => getModelType(r.modelId) === 'image-generation');
    
    const successfulChatModels = chatModels.filter(r => r.success);
    const failedChatModels = chatModels.filter(r => !r.success);
    const successfulImageModels = imageModels.filter(r => r.success);
    const failedImageModels = imageModels.filter(r => !r.success);
    
    log(`\n🎯 聊天模型测试结果:`, 'yellow');
    log(`   成功: ${successfulChatModels.length}/${chatModels.length}`, 'green');
    log(`   失败: ${failedChatModels.length}/${chatModels.length}`, failedChatModels.length > 0 ? 'red' : 'green');
    
    log(`\n🎨 图像生成模型测试结果:`, 'yellow');
    log(`   成功: ${successfulImageModels.length}/${imageModels.length}`, 'green');
    log(`   失败: ${failedImageModels.length}/${imageModels.length}`, failedImageModels.length > 0 ? 'red' : 'green');
    
    // 按提供商统计
    const providerStats = {};
    modelTestResults.forEach(result => {
        if (!providerStats[result.provider]) {
            providerStats[result.provider] = { total: 0, success: 0 };
        }
        providerStats[result.provider].total++;
        if (result.success) {
            providerStats[result.provider].success++;
        }
    });
    
    log(`\n📊 按提供商统计:`, 'cyan');
    Object.keys(providerStats).forEach(provider => {
        const stats = providerStats[provider];
        const successRate = ((stats.success / stats.total) * 100).toFixed(1);
        const color = stats.success === stats.total ? 'green' : 'yellow';
        log(`   ${provider}: ${stats.success}/${stats.total} (${successRate}%)`, color);
    });
    
    // 失败模型详情
    const failedModels = modelTestResults.filter(r => !r.success);
    if (failedModels.length > 0) {
        log(`\n❌ 失败的模型:`, 'red');
        failedModels.forEach(result => {
            const modelType = getModelType(result.modelId);
            log(`   ${result.modelId} [${result.provider}] (${modelType}) - ${result.statusCode || 'Error'}`, 'red');
        });
    }
    
    // 总体结果
    log(`\n🎯 总体结果:`, 'yellow');
    log(`   成功: ${successfulTests}/${totalTests}`, successfulTests === totalTests ? 'green' : 'yellow');
    log(`   成功率: ${((successfulTests / totalTests) * 100).toFixed(1)}%`, successfulTests === totalTests ? 'green' : 'yellow');
    
    // 开发环境使用指南
    log(`\n💡 开发环境使用指南:`, 'cyan');
    log('   • 启动开发服务器: npm run dev', 'white');
    log('   • 本地模式 (离线): npm run dev:local', 'white');
    log('   • 详细测试: node test-dev.js --verbose', 'white');
    log('   • 单模型测试: node test-dev.js --model "model-name"', 'white');
    log('   • 修改代码后自动重载，无需重启', 'white');
    
    log(`\n🔗 开发环境特性:`, 'green');
    log('   ✅ 无KV存储依赖 - 快速启动', 'white');
    log('   ✅ 热重载 - 代码修改即时生效', 'white');
    log('   ✅ 详细日志 - 便于调试问题', 'white');
    log('   ✅ 本地开发 - 无需部署即可测试', 'white');
    log('   ✅ 图像生成测试 - 自动保存生成的图片', 'white');
    
    log(`\n🎉 开发环境测试完成！`, 'green');
}

// 主函数
async function main() {
    log('🛠️ Galatea AI Gateway 开发环境测试', 'cyan');
    log('=========================================', 'cyan');
    log(`🔗 测试地址: ${CONFIG.baseUrl}`, 'yellow');
    
    // 确保输出目录存在
    ensureOutputDir();
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    const verbose = args.includes('--verbose') || args.includes('-v');
    const modelIndex = args.indexOf('--model') !== -1 ? args.indexOf('--model') + 1 : -1;
    const specificModel = modelIndex !== -1 && args[modelIndex] ? args[modelIndex] : null;
    
    try {
        // 1. 检查服务器状态
        const serverOk = await checkServerStatus();
        if (!serverOk) {
            process.exit(1);
        }
        
        // 2. 健康检查
        const healthResult = await healthCheck();
        
        // 3. 获取模型列表
        const availableModels = await getModels();
        
        // 4. 检查环境配置
        const configResult = checkEnvironmentConfig();
        
        // 5. 测试模型
        let modelsToTest = availableModels;
        if (specificModel) {
            if (availableModels.includes(specificModel)) {
                modelsToTest = [specificModel];
                log(`\n🎯 测试指定模型: ${specificModel}`, 'cyan');
            } else {
                logError(`指定的模型 '${specificModel}' 不在可用列表中`);
                log(`可用模型: ${availableModels.join(', ')}`, 'yellow');
                process.exit(1);
            }
        }
        
        const modelTestResults = await testAllModels(modelsToTest);
        
        // 6. 生成报告
        generateReport(healthResult, availableModels, configResult, modelTestResults);
        
    } catch (error) {
        logError(`测试过程中发生错误: ${error.message}`);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        logError(`程序执行失败: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    makeRequest,
    testModel,
    getModelProvider
};

// 确保输出目录存在
function ensureOutputDir() {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        log(`📁 创建输出目录: ${CONFIG.outputDir}`, 'cyan');
    }
}